import { createSuperAdminIfMissing, splitFullName } from "@qr-platform/database";
import * as argon2 from "argon2";

// The e2e webServer always runs the API with NODE_ENV=test (see
// tests/playwright.config.ts), so apps/api's DevelopmentBootstrapService
// (which only ever runs under NODE_ENV=development, by design - see HOTFIX
// "Otomatik Development Super Admin") never fires during an e2e run. This
// seeds the exact same fixed DEV_ADMIN_* account directly via the same
// shared primitive, so the login/redirect/toast-dedup specs can exercise a
// real login with real credentials against a real database.
export async function ensureDevAdminExists(): Promise<{ email: string; password: string }> {
  const name = process.env["DEV_ADMIN_NAME"];
  const email = process.env["DEV_ADMIN_EMAIL"];
  const password = process.env["DEV_ADMIN_PASSWORD"];

  if (!name || !email || !password) {
    throw new Error(
      "DEV_ADMIN_NAME/DEV_ADMIN_EMAIL/DEV_ADMIN_PASSWORD must be set in .env.development for the dev-admin e2e spec.",
    );
  }

  const { firstName, lastName } = splitFullName(name);
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  await createSuperAdminIfMissing({ firstName, lastName, email, passwordHash });

  return { email, password };
}
