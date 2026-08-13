import { JwtService } from "@nestjs/jwt";
import { prisma } from "@qr-platform/database";

import { SessionService } from "./session.service";
import { TokenService } from "./token.service";

// ts-jest hoists jest.mock() calls above the imports above at compile time,
// so this physical position (after the imports it mocks) is safe.
jest.mock("@qr-platform/database", () => ({
  prisma: {
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  session: {
    create: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    deleteMany: jest.Mock;
  };
};

function createSessionService(): SessionService {
  return new SessionService(new TokenService(new JwtService({ secret: "a".repeat(32) })));
}

describe("SessionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a session row with a hashed refresh token, and returns the raw token separately", async () => {
    prismaMock.session.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({ id: "session-1", ...data }),
    );
    const service = createSessionService();

    const { session, refreshToken } = await service.createSession({
      userId: "user-1",
      tenantUserId: "tu-1",
      ip: "127.0.0.1",
      userAgent: "test-agent",
    });

    expect(prismaMock.session.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        tenantUserId: "tu-1",
        refreshTokenHash: refreshToken.tokenHash,
      }),
    });
    // The row must never store the raw token, only its hash.
    expect(session).not.toHaveProperty("refreshToken");
    expect(refreshToken.token).not.toBe(refreshToken.tokenHash);
  });

  it("rotateRefreshToken updates the SAME row in place rather than creating a new one", async () => {
    prismaMock.session.update.mockImplementation(({ where, data }: Record<string, unknown>) =>
      Promise.resolve({ id: (where as { id: string }).id, ...(data as Record<string, unknown>) }),
    );
    const service = createSessionService();

    const { session: rotated, refreshToken: newToken } = await service.rotateRefreshToken("session-1");

    expect(prismaMock.session.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.session.update).toHaveBeenCalledWith({
      where: { id: "session-1" },
      data: expect.objectContaining({ refreshTokenHash: newToken.tokenHash }),
    });
    expect(rotated.id).toBe("session-1");
    expect(prismaMock.session.create).not.toHaveBeenCalled();
  });

  it("findByRefreshToken looks up by the token's hash, never the raw value", async () => {
    prismaMock.session.findUnique.mockResolvedValue(null);
    const service = createSessionService();

    await service.findByRefreshToken("some-raw-refresh-token");

    const [[callArgs]] = prismaMock.session.findUnique.mock.calls as [[{ where: { refreshTokenHash: string } }]];
    expect(callArgs.where.refreshTokenHash).not.toBe("some-raw-refresh-token");
    expect(callArgs.where.refreshTokenHash).toHaveLength(64); // sha256 hex digest
  });

  it("deleteById is idempotent (uses deleteMany so a missing session doesn't throw)", async () => {
    prismaMock.session.deleteMany.mockResolvedValue({ count: 0 });
    const service = createSessionService();

    await expect(service.deleteById("already-gone")).resolves.toBeUndefined();
    expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({ where: { id: "already-gone" } });
  });
});
