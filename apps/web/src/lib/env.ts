// Sprint 0: this is the single place in the web app that reads
// `process.env` directly. Everything else consumes `getApiUrl()`.
export function getApiUrl(): string {
  const apiUrl = process.env["NEXT_PUBLIC_API_URL"];

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  return apiUrl;
}
