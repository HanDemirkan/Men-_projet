export class StorageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageValidationError";
  }
}

export interface UploadValidationOptions {
  maxFileSizeMb: number;
  allowedMimeTypes: string[];
}

export interface UploadCandidate {
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
}

export function validateUpload(candidate: UploadCandidate, options: UploadValidationOptions): void {
  const maxBytes = options.maxFileSizeMb * 1024 * 1024;

  if (candidate.sizeBytes > maxBytes) {
    throw new StorageValidationError(
      `File "${candidate.originalFilename}" exceeds the maximum allowed size of ${options.maxFileSizeMb}MB.`,
    );
  }

  if (!options.allowedMimeTypes.includes(candidate.mimeType)) {
    throw new StorageValidationError(
      `MIME type "${candidate.mimeType}" is not allowed. Allowed types: ${options.allowedMimeTypes.join(", ")}.`,
    );
  }
}
