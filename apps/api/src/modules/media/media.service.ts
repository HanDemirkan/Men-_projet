import { randomUUID } from "node:crypto";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { prisma, tenantScopedPrisma } from "@qr-platform/database";
import type { MediaType } from "@qr-platform/database";
import { StorageValidationError } from "@qr-platform/storage";
import type { StorageService } from "@qr-platform/storage";
import sharp from "sharp";

import { AppException } from "../../common/exceptions/app.exception";
import { STORAGE_SERVICE } from "../storage/storage.tokens";

// Storage's own mime allowlist (STORAGE_ALLOWED_MIME_TYPES) is the real
// business-rule check, enforced inside `storage.save()` - this map only
// decides which file extension a validated upload gets written under.
const MIME_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

// 400x400 max, aspect-ratio preserved, never upscaled - "thumbnail
// infrastructure" the spec asks for, generated for real on every upload.
const THUMBNAIL_MAX_DIMENSION = 400;

export interface UploadMediaInput {
  tenantId: string;
  type: MediaType;
  buffer: Buffer;
  mimeType: string;
  originalFilename: string;
  uploadedByUserId: string;
}

@Injectable()
export class MediaService {
  constructor(@Inject(STORAGE_SERVICE) private readonly storage: StorageService) {}

  async upload(input: UploadMediaInput) {
    const extension = MIME_EXTENSIONS[input.mimeType];

    if (!extension) {
      throw new AppException(
        "UNSUPPORTED_MEDIA_TYPE",
        `Desteklenmeyen dosya türü: ${input.mimeType}.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const id = randomUUID();
    const key = `tenants/${input.tenantId}/media/${id}.${extension}`;

    try {
      await this.storage.save({
        key,
        data: input.buffer,
        mimeType: input.mimeType,
        originalFilename: input.originalFilename,
      });
    } catch (error) {
      if (error instanceof StorageValidationError) {
        throw new AppException("MEDIA_VALIDATION_FAILED", error.message, HttpStatus.BAD_REQUEST);
      }
      throw error;
    }

    const metadata = await sharp(input.buffer).metadata();
    const thumbnailKey = `tenants/${input.tenantId}/media/${id}-thumb.${extension}`;
    const thumbnailBuffer = await sharp(input.buffer)
      .resize(THUMBNAIL_MAX_DIMENSION, THUMBNAIL_MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
      .toBuffer();
    await this.storage.save({
      key: thumbnailKey,
      data: thumbnailBuffer,
      mimeType: input.mimeType,
      originalFilename: input.originalFilename,
    });

    return tenantScopedPrisma.media.create({
      data: {
        // The extension stamps/overwrites this with the live tenant context
        // regardless (see tenant-scoped-client.ts) - passed here only to
        // satisfy Prisma's generated input type, and matches the same
        // tenantId the storage key above was built from.
        tenantId: input.tenantId,
        type: input.type,
        key,
        thumbnailKey,
        mimeType: input.mimeType,
        sizeBytes: input.buffer.byteLength,
        width: metadata.width ?? null,
        height: metadata.height ?? null,
        originalFilename: input.originalFilename,
        uploadedByUserId: input.uploadedByUserId,
      },
    });
  }

  list() {
    return tenantScopedPrisma.media.findMany({ orderBy: { createdAt: "desc" } });
  }

  async delete(id: string): Promise<void> {
    const media = await tenantScopedPrisma.media.findUnique({ where: { id } });

    if (!media) {
      throw new AppException("MEDIA_NOT_FOUND", "Medya bulunamadı.", HttpStatus.NOT_FOUND);
    }

    await tenantScopedPrisma.media.delete({ where: { id } });
    await this.storage.delete(media.key);

    if (media.thumbnailKey) {
      await this.storage.delete(media.thumbnailKey);
    }
  }

  // No tenant context exists for the public file-streaming endpoints (an
  // anonymous request) - deliberate exception, same pattern as AuditService/
  // IdentityService (ADR 0007). An opaque UUID lookup with no listing
  // capability doesn't leak cross-tenant data.
  findByIdUnscoped(id: string) {
    return prisma.media.findUnique({ where: { id } });
  }

  getAbsolutePath(key: string): string {
    return this.storage.getAbsolutePath(key);
  }
}
