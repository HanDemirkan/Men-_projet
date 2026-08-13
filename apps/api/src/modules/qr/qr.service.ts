import { readFile } from "node:fs/promises";

import { HttpStatus, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@qr-platform/database";
import type { QrErrorCorrectionLevel } from "@qr-platform/shared";
import type { StorageService } from "@qr-platform/storage";
import QRCode from "qrcode";
import sharp from "sharp";

import { AppConfigService } from "../../common/config/app-config.service";
import { AppException } from "../../common/exceptions/app.exception";
import { STORAGE_SERVICE } from "../storage/storage.tokens";

export type QrFormat = "svg" | "png";

export interface GenerateQrInput {
  tenantId: string;
  format: QrFormat;
  errorCorrectionLevel: QrErrorCorrectionLevel;
  includeLogo: boolean;
}

export interface GeneratedQr {
  buffer: Buffer;
  contentType: string;
}

// The primary QR the QR Builder lets a business download - always encodes
// the storefront root URL (/{tenantSlug}), never a category/product-specific
// target (not requested by the spec - see ADR 0009's known-gaps note).
// A high error-correction level is recommended (not enforced) when a logo is
// embedded, since the logo occludes part of the code.
const QR_PIXEL_SIZE = 512;
const LOGO_SIZE_RATIO = 0.22;

@Injectable()
export class QrService {
  constructor(
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
    private readonly appConfig: AppConfigService,
  ) {}

  async generate(input: GenerateQrInput): Promise<GeneratedQr> {
    const tenant = await prisma.tenant.findUnique({ where: { id: input.tenantId } });

    if (!tenant) {
      throw new NotFoundException("İşletme bulunamadı.");
    }

    // `?src=qr` lets PublicStorefrontController tell a scan-originated visit
    // apart from a direct link/search/share visit when recording a
    // StorefrontView - see the business dashboard's "QR görüntülenme sayısı".
    const publicUrl = `${this.appConfig.publicAppUrl}/${tenant.slug}?src=qr`;
    const logoBuffer = input.includeLogo ? await this.loadLogoBuffer(tenant.logoImageId) : null;

    if (input.format === "png") {
      return this.generatePng(publicUrl, input.errorCorrectionLevel, logoBuffer);
    }

    return this.generateSvg(publicUrl, input.errorCorrectionLevel, logoBuffer);
  }

  private async generatePng(
    publicUrl: string,
    errorCorrectionLevel: QrErrorCorrectionLevel,
    logoBuffer: Buffer | null,
  ): Promise<GeneratedQr> {
    const qrBuffer: Buffer = await QRCode.toBuffer(publicUrl, {
      type: "png",
      errorCorrectionLevel,
      width: QR_PIXEL_SIZE,
      margin: 1,
    });

    if (!logoBuffer) {
      return { buffer: qrBuffer, contentType: "image/png" };
    }

    const logoSize = Math.round(QR_PIXEL_SIZE * LOGO_SIZE_RATIO);
    const resizedLogo = await sharp(logoBuffer)
      .resize(logoSize, logoSize, { fit: "cover" })
      .toBuffer();

    const composited = await sharp(qrBuffer)
      .composite([{ input: resizedLogo, gravity: "center" }])
      .png()
      .toBuffer();

    return { buffer: composited, contentType: "image/png" };
  }

  private async generateSvg(
    publicUrl: string,
    errorCorrectionLevel: QrErrorCorrectionLevel,
    logoBuffer: Buffer | null,
  ): Promise<GeneratedQr> {
    const svg = await QRCode.toString(publicUrl, {
      type: "svg",
      errorCorrectionLevel,
      margin: 1,
    });

    if (!logoBuffer) {
      return { buffer: Buffer.from(svg), contentType: "image/svg+xml" };
    }

    const sizeMatch = /viewBox="0 0 (\d+) (\d+)"/.exec(svg);
    const viewBoxSize = sizeMatch ? Number(sizeMatch[1]) : 100;
    const logoSize = viewBoxSize * LOGO_SIZE_RATIO;
    const logoOffset = (viewBoxSize - logoSize) / 2;
    const pngLogo = await sharp(logoBuffer).png().toBuffer();
    const logoDataUri = `data:image/png;base64,${pngLogo.toString("base64")}`;

    const logoElement = `<image href="${logoDataUri}" x="${logoOffset}" y="${logoOffset}" width="${logoSize}" height="${logoSize}" />`;
    const svgWithLogo = svg.replace("</svg>", `${logoElement}</svg>`);

    return { buffer: Buffer.from(svgWithLogo), contentType: "image/svg+xml" };
  }

  private async loadLogoBuffer(logoImageId: string | null): Promise<Buffer | null> {
    if (!logoImageId) {
      return null;
    }

    const media = await prisma.media.findUnique({ where: { id: logoImageId } });

    if (!media) {
      throw new AppException(
        "MEDIA_TENANT_MISMATCH",
        "Logo görseli bulunamadı.",
        HttpStatus.BAD_REQUEST,
        [{ field: "logoImageId", message: "Logo görseli bulunamadı." }],
      );
    }

    return readFile(this.storage.getAbsolutePath(media.key));
  }
}
