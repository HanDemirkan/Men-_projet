import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import type { StorageService, StoredFile, UploadInput } from "./storage.types";
import type { UploadValidationOptions } from "./validate-upload";
import { validateUpload } from "./validate-upload";

export class LocalStorageAdapter implements StorageService {
  private readonly rootDir: string;
  private readonly validationOptions: UploadValidationOptions;

  constructor(rootDir: string, validationOptions: UploadValidationOptions) {
    if (!path.isAbsolute(rootDir)) {
      throw new Error(`LocalStorageAdapter requires an absolute rootDir, received "${rootDir}".`);
    }

    this.rootDir = rootDir;
    this.validationOptions = validationOptions;
  }

  async save(input: UploadInput): Promise<StoredFile> {
    validateUpload(
      {
        originalFilename: input.originalFilename,
        mimeType: input.mimeType,
        sizeBytes: input.data.byteLength,
      },
      this.validationOptions,
    );

    const key = this.normalizeKey(input.key);
    const absolutePath = path.join(this.rootDir, key);

    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, input.data);

    return {
      key,
      absolutePath,
      sizeBytes: input.data.byteLength,
      mimeType: input.mimeType,
    };
  }

  getAbsolutePath(key: string): string {
    return path.join(this.rootDir, this.normalizeKey(key));
  }

  async exists(key: string): Promise<boolean> {
    try {
      await stat(this.getAbsolutePath(key));
      return true;
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    await rm(this.getAbsolutePath(key), { force: true });
  }

  // Rejects absolute paths and `..` segments so a caller-supplied key can
  // never escape `rootDir` (path traversal).
  private normalizeKey(key: string): string {
    const normalized = path.normalize(key).replace(/^([/\\])+/, "");

    if (normalized.split(/[/\\]/).includes("..")) {
      throw new Error(`Storage key "${key}" is not allowed (path traversal).`);
    }

    return normalized;
  }
}
