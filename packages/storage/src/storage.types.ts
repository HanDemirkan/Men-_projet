export interface StoredFile {
  key: string;
  absolutePath: string;
  sizeBytes: number;
  mimeType: string;
}

export interface UploadInput {
  // Caller-chosen relative path under the storage root, e.g. "tenants/<id>/logo.png".
  key: string;
  data: Buffer;
  mimeType: string;
  originalFilename: string;
}

// Framework-agnostic contract so both `api` and (eventually) `worker` can
// depend on it without pulling in Nest. `LocalStorageAdapter` is the only
// implementation today; a future remote adapter (e.g. S3-compatible) would
// implement the same interface without callers changing.
export interface StorageService {
  save(input: UploadInput): Promise<StoredFile>;
  getAbsolutePath(key: string): string;
  exists(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
}
