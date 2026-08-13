// Production bootstrap: creates the platform's first SUPER_ADMIN account.
// Unlike prisma/seed.ts (dev/demo data - fake tenant, fake users, a shared
// publicly-documented password), this is meant to run once against a real
// production database with real, operator-supplied credentials. Idempotent:
// running it again never creates a second account or touches the password
// of an account that already exists - see bootstrapAdmin() below.
//
// Usage: pnpm bootstrap:admin
// Required env: BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD
import * as argon2 from "argon2";

import { createSuperAdminIfMissing, splitFullName } from "../src/admin-bootstrap";
import { prisma } from "../src/client";

// Same policy as ResetPasswordDto (apps/api/src/modules/auth/dto/reset-password.dto.ts)
// - one password policy for the whole system, not a second one invented here.
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;
// Deliberately simple (not full RFC 5322) - matches the strictness class-validator's
// IsEmail applies elsewhere in this codebase, without pulling class-validator into
// packages/database just for one check.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface BootstrapAdminInput {
  name: string;
  email: string;
  password: string;
}

export type BootstrapAdminResult = { status: "created" | "exists"; email: string };

export class BootstrapValidationError extends Error {}

export function validateInput(input: Partial<BootstrapAdminInput>): BootstrapAdminInput {
  const missing = (["name", "email", "password"] as const).filter((key) => !input[key]);
  if (missing.length > 0) {
    const envNames = missing.map((key) => `BOOTSTRAP_ADMIN_${key.toUpperCase()}`);
    throw new BootstrapValidationError(`Eksik environment değişken(ler): ${envNames.join(", ")}`);
  }

  const { password } = input as BootstrapAdminInput;
  const name = (input.name as string).trim();
  const email = (input.email as string).trim().toLowerCase();

  if (name.length === 0) {
    throw new BootstrapValidationError("BOOTSTRAP_ADMIN_NAME boş olamaz.");
  }

  if (!EMAIL_PATTERN.test(email)) {
    throw new BootstrapValidationError(`BOOTSTRAP_ADMIN_EMAIL geçerli bir e-posta adresi değil: "${email}"`);
  }

  if (password.length < PASSWORD_MIN_LENGTH || !PASSWORD_PATTERN.test(password)) {
    throw new BootstrapValidationError(
      `BOOTSTRAP_ADMIN_PASSWORD en az ${PASSWORD_MIN_LENGTH} karakter olmalı ve en az bir harf ile bir rakam içermelidir.`,
    );
  }

  return { name, email, password };
}

// Idempotency contract: a second run with the same (or different)
// BOOTSTRAP_ADMIN_* values never creates a second account for an email that
// already has a platform-level SUPER_ADMIN membership, and never rewrites
// an existing account's password.
export async function bootstrapAdmin(rawInput: Partial<BootstrapAdminInput>): Promise<BootstrapAdminResult> {
  const input = validateInput(rawInput);
  const { firstName, lastName } = splitFullName(input.name);
  const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });

  const result = await createSuperAdminIfMissing({ firstName, lastName, email: input.email, passwordHash });

  return { status: result.status, email: input.email };
}

async function main(): Promise<void> {
  // Read directly from process.env here (not passed as CLI args) so the
  // password never appears in shell history or a process list.
  const result = await bootstrapAdmin({
    name: process.env["BOOTSTRAP_ADMIN_NAME"],
    email: process.env["BOOTSTRAP_ADMIN_EMAIL"],
    password: process.env["BOOTSTRAP_ADMIN_PASSWORD"],
  });

  if (result.status === "created") {
    console.log(`✓ Super Admin created (${result.email})`);
  } else {
    console.log(`✓ Super Admin already exists (${result.email})`);
  }
}

// Only run when executed directly as a script (`pnpm bootstrap:admin`) -
// never as a side effect of importing `bootstrapAdmin`/`validateInput` from
// a test file, which would otherwise read the test process's env, likely
// fail validation, and `process.exit(1)` the entire test run.
if (require.main === module) {
  main()
    .catch((error: unknown) => {
      // Never let a validation/DB error's stack trace be the only thing on
      // screen without context - but also never log `process.env` wholesale,
      // which would leak BOOTSTRAP_ADMIN_PASSWORD.
      if (error instanceof BootstrapValidationError) {
        console.error(`✗ ${error.message}`);
      } else {
        console.error("✗ Super Admin bootstrap failed:", error);
      }
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
