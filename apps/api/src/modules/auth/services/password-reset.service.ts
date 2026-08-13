import { createHash, randomBytes } from "node:crypto";

import { Injectable } from "@nestjs/common";
import { prisma } from "@qr-platform/database";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// Tokens are random, high-entropy, single-use, and stored only as a SHA-256
// hash (never the raw value) - see ADR 0007 for why SHA-256 rather than
// argon2 is the correct choice here (argon2's deliberate slowness targets
// low-entropy human passwords, not a 256-bit random token).
@Injectable()
export class PasswordResetService {
  async createResetToken(userId: string): Promise<string> {
    const token = randomBytes(32).toString("base64url");

    await prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    return token;
  }

  // Returns the associated userId and marks the token used, or null if the
  // token is unknown, expired, or already used. Callers must treat a null
  // result as "invalid token" without distinguishing which case it was.
  async consumeResetToken(rawToken: string): Promise<string | null> {
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(rawToken) },
    });

    if (!record || record.usedAt !== null || record.expiresAt < new Date()) {
      return null;
    }

    await prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    return record.userId;
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
