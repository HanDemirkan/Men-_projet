import { createReadStream } from "node:fs";

import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { PERMISSIONS } from "@qr-platform/permissions";
import type { Response } from "express";
import { memoryStorage } from "multer";

import { CurrentTenant } from "../auth/decorators/current-tenant.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Public } from "../auth/decorators/public.decorator";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.types";

import { UploadMediaDto } from "./dto/upload-media.dto";
import { MediaService } from "./media.service";

type MediaVariant = "original" | "thumbnail";

@ApiTags("media")
@Controller("media")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.MEDIA_UPLOAD)
  @UseInterceptors(FileInterceptor("file", { storage: memoryStorage() }))
  @ApiOperation({ summary: "Bir görsel yükler (logo, kapak, kategori, ürün)" })
  @ApiConsumes("multipart/form-data")
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadMediaDto,
    @CurrentTenant() tenantId: string | null,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) {
      throw new NotFoundException("Yüklenecek dosya bulunamadı.");
    }

    if (!tenantId) {
      throw new ForbiddenException("Bu işlem için bir işletmeye bağlı olmanız gerekir.");
    }

    return this.mediaService.upload({
      tenantId,
      type: dto.type,
      buffer: file.buffer,
      mimeType: file.mimetype,
      originalFilename: file.originalname,
      uploadedByUserId: user.userId,
    });
  }

  @Get()
  @RequirePermissions(PERMISSIONS.MEDIA_UPLOAD)
  @ApiOperation({ summary: "Mevcut tenant'ın medya listesi" })
  list() {
    return this.mediaService.list();
  }

  @Public()
  @Get(":id/file")
  @ApiOperation({ summary: "Orijinal dosyayı stream eder (herkese açık)" })
  async streamFile(@Param("id") id: string, @Res() res: Response): Promise<void> {
    await this.stream(id, "original", res);
  }

  @Public()
  @Get(":id/thumbnail")
  @ApiOperation({ summary: "Küçük görseli stream eder (herkese açık)" })
  async streamThumbnail(@Param("id") id: string, @Res() res: Response): Promise<void> {
    await this.stream(id, "thumbnail", res);
  }

  @Delete(":id")
  @RequirePermissions(PERMISSIONS.MEDIA_MANAGE)
  @ApiOperation({ summary: "Medyayı ve dosyalarını siler" })
  async remove(@Param("id") id: string): Promise<{ deleted: true }> {
    await this.mediaService.delete(id);
    return { deleted: true };
  }

  private async stream(id: string, variant: MediaVariant, res: Response): Promise<void> {
    const media = await this.mediaService.findByIdUnscoped(id);

    if (!media) {
      throw new NotFoundException("Medya bulunamadı.");
    }

    const key = variant === "thumbnail" ? media.thumbnailKey : media.key;

    if (!key) {
      throw new NotFoundException("Küçük görsel bulunamadı.");
    }

    res.setHeader("Content-Type", media.mimeType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    // Overrides helmet's global `Cross-Origin-Resource-Policy: same-origin`
    // default - these two routes exist specifically to be embedded from a
    // different origin (the web app, on a different port in dev; a future
    // public storefront always), so browsers must not block that load.
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    createReadStream(this.mediaService.getAbsolutePath(key)).pipe(res);
  }
}
