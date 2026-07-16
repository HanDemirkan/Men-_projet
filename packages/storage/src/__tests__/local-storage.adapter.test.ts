import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { LocalStorageAdapter } from "../local-storage.adapter";
import { StorageValidationError } from "../validate-upload";

const validationOptions = { maxFileSizeMb: 1, allowedMimeTypes: ["image/png"] };

describe("LocalStorageAdapter", () => {
  let rootDir: string;
  let adapter: LocalStorageAdapter;

  beforeEach(async () => {
    rootDir = await mkdtemp(path.join(tmpdir(), "qr-platform-storage-"));
    adapter = new LocalStorageAdapter(rootDir, validationOptions);
  });

  afterEach(async () => {
    await rm(rootDir, { recursive: true, force: true });
  });

  it("throws when constructed with a relative rootDir", () => {
    expect(() => new LocalStorageAdapter("relative/path", validationOptions)).toThrow();
  });

  it("saves a file under the root directory and returns its metadata", async () => {
    const data = Buffer.from("fake-png-bytes");

    const result = await adapter.save({
      key: "tenants/acme/logo.png",
      data,
      mimeType: "image/png",
      originalFilename: "logo.png",
    });

    expect(result.absolutePath).toBe(path.join(rootDir, "tenants/acme/logo.png"));
    expect(await readFile(result.absolutePath)).toEqual(data);
    expect(await adapter.exists("tenants/acme/logo.png")).toBe(true);
  });

  it("rejects an upload that fails validation before writing anything", async () => {
    await expect(
      adapter.save({
        key: "evil.exe",
        data: Buffer.from("x"),
        mimeType: "application/octet-stream",
        originalFilename: "evil.exe",
      }),
    ).rejects.toThrow(StorageValidationError);

    expect(await adapter.exists("evil.exe")).toBe(false);
  });

  it("rejects path traversal keys", async () => {
    await expect(
      adapter.save({
        key: "../../etc/passwd",
        data: Buffer.from("x"),
        mimeType: "image/png",
        originalFilename: "passwd",
      }),
    ).rejects.toThrow(/path traversal/);
  });

  it("deletes a stored file", async () => {
    await adapter.save({
      key: "logo.png",
      data: Buffer.from("x"),
      mimeType: "image/png",
      originalFilename: "logo.png",
    });

    await adapter.delete("logo.png");

    expect(await adapter.exists("logo.png")).toBe(false);
  });
});
