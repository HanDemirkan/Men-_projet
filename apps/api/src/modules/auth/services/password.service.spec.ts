import { PasswordService } from "./password.service";

describe("PasswordService", () => {
  const service = new PasswordService();

  it("hashes a password using argon2id and verifies it back successfully", async () => {
    const hash = await service.hash("Passw0rd!23");

    expect(hash).toMatch(/^\$argon2id\$/);
    await expect(service.verify(hash, "Passw0rd!23")).resolves.toBe(true);
  });

  it("rejects the wrong password", async () => {
    const hash = await service.hash("Passw0rd!23");

    await expect(service.verify(hash, "WrongPassword")).resolves.toBe(false);
  });

  it("returns false instead of throwing for a malformed hash", async () => {
    await expect(service.verify("not-a-real-hash", "anything")).resolves.toBe(false);
  });

  it("produces a different hash for the same password on each call (random salt)", async () => {
    const [first, second] = await Promise.all([
      service.hash("Passw0rd!23"),
      service.hash("Passw0rd!23"),
    ]);

    expect(first).not.toBe(second);
  });
});
