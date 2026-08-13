// Runs once before any spec, after Playwright's webServer entries report a
// successful HTTP response. That alone only proves *something* answered the
// port - not that it's this project's API/web app, and not that the API's
// actual dependencies (Postgres, Redis) are reachable. A stale process left
// over from another local project, or an API that's "up" but can't reach its
// database, would otherwise only surface as a confusing mid-suite failure
// somewhere unrelated. This fails fast, with a clear message, before a
// single test runs.
const WEB_PORT = process.env["WEB_PORT"] ?? "3001";
const API_PORT = process.env["API_PORT"] ?? "4000";

async function checkApiReady(): Promise<void> {
  const url = `http://localhost:${API_PORT}/api/v1/health/ready`;
  const res = await fetch(url).catch((err: unknown) => {
    throw new Error(`[global-setup] Cannot reach API readiness endpoint at ${url}: ${String(err)}`);
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "<unreadable body>");
    throw new Error(
      `[global-setup] API reported NOT ready at ${url} (HTTP ${res.status}). ` +
        `This means Postgres and/or Redis were unreachable at test-suite start, not just that ` +
        `the Node process was listening. Body: ${body}`,
    );
  }

  // Wrapped in this API's standard { success, data, meta } envelope - see
  // any real endpoint response (e.g. ApiResponse<T> in packages/shared).
  const body = (await res.json()) as {
    data?: { services?: { api?: string; database?: string; redis?: string } };
  };
  const services = body.data?.services;
  if (services?.api !== "up" || services?.database !== "up" || services?.redis !== "up") {
    throw new Error(
      `[global-setup] API readiness body has unexpected shape/values (possible port collision with ` +
        `a different process bound to ${API_PORT}): ${JSON.stringify(body)}`,
    );
  }
}

async function checkWebIsThisApp(): Promise<void> {
  const url = `http://localhost:${WEB_PORT}/login`;
  const res = await fetch(url).catch((err: unknown) => {
    throw new Error(`[global-setup] Cannot reach web app at ${url}: ${String(err)}`);
  });

  if (!res.ok) {
    throw new Error(`[global-setup] Web app returned HTTP ${res.status} at ${url}.`);
  }

  const html = await res.text();
  // A distinguishing string from this app's own login page, not a generic
  // "server responded" check - catches another local Next.js project
  // accidentally bound to the same port (a real, previously-hit failure mode
  // on this machine per .env.development's own port-collision comment).
  if (!html.includes("QR Platform") || !html.includes("Giriş Yap")) {
    throw new Error(
      `[global-setup] The server on port ${WEB_PORT} responded, but its HTML doesn't look like this ` +
        `project's login page - likely a different process (e.g. another local project's dev server) ` +
        `is bound to that port instead of this one.`,
    );
  }
}

export default async function globalSetup(): Promise<void> {
  await Promise.all([checkApiReady(), checkWebIsThisApp()]);
}
