import { describe, expect, it } from "vitest";

import { StorageValidationError, validateUpload } from "../validate-upload";

const options = { maxFileSizeMb: 1, allowedMimeTypes: ["image/png", "image/jpeg"] };

describe("validateUpload", () => {
  it("accepts a file within the size limit and allowed mime type", () => {
    expect(() =>
      validateUpload(
        { originalFilename: "logo.png", mimeType: "image/png", sizeBytes: 1024 },
        options,
      ),
    ).not.toThrow();
  });

  it("rejects a file over the size limit", () => {
    expect(() =>
      validateUpload(
        { originalFilename: "logo.png", mimeType: "image/png", sizeBytes: 2 * 1024 * 1024 },
        options,
      ),
    ).toThrow(StorageValidationError);
  });

  it("rejects a disallowed mime type", () => {
    expect(() =>
      validateUpload(
        { originalFilename: "script.js", mimeType: "application/javascript", sizeBytes: 10 },
        options,
      ),
    ).toThrow(StorageValidationError);
  });
});
