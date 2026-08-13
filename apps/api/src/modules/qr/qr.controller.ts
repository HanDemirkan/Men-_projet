import { Controller, ForbiddenException, Get, Header, Query, Res } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PERMISSIONS } from "@qr-platform/permissions";
import type { QrErrorCorrectionLevel } from "@qr-platform/shared";
import type { Response } from "express";

import { CurrentTenant } from "../auth/decorators/current-tenant.decorator";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";

import type { QrFormat } from "./qr.service";
import { QrService } from "./qr.service";

@ApiTags("qr")
@Controller("qr-code")
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.QR_GENERATE)
  @Header("Cache-Control", "no-store")
  @ApiOperation({ summary: "Storefront kök URL'ini kodlayan QR üretir (SVG/PNG, opsiyonel logo)" })
  async generate(
    @CurrentTenant() tenantId: string | null,
    @Res() res: Response,
    @Query("format") format: QrFormat = "png",
    @Query("errorCorrectionLevel") errorCorrectionLevel: QrErrorCorrectionLevel = "Q",
    @Query("includeLogo") includeLogo?: string,
    @Query("download") download?: string,
  ): Promise<void> {
    if (!tenantId) {
      throw new ForbiddenException("Bu işlem için bir işletmeye bağlı olmanız gerekir.");
    }

    const result = await this.qrService.generate({
      tenantId,
      format: format === "svg" ? "svg" : "png",
      errorCorrectionLevel,
      includeLogo: includeLogo === "true",
    });

    res.setHeader("Content-Type", result.contentType);
    // Overrides helmet's global `Cross-Origin-Resource-Policy: same-origin`
    // default - the QR Builder's live preview embeds this as a cross-origin
    // <img> (web:3001 -> api:4000 in dev), same reasoning as Media's public
    // streaming routes (see ADR 0009).
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    if (download === "true") {
      res.setHeader("Content-Disposition", `attachment; filename="qr-code.${format === "svg" ? "svg" : "png"}"`);
    }
    res.send(result.buffer);
  }
}
