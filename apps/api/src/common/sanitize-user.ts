// Every endpoint that returns a User (directly or nested inside a tenant/
// membership) must strip passwordHash before it ever reaches a response
// body - it's a hash, not plaintext, but there is still no reason for it to
// leave the server. Shared by the admin and business modules.
export type SanitizedUser<T extends { passwordHash?: unknown }> = Omit<T, "passwordHash">;

export function sanitizeUser<T extends { passwordHash?: unknown }>(user: T): SanitizedUser<T> {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

export function sanitizeUsers<T extends { passwordHash?: unknown }>(users: T[]): SanitizedUser<T>[] {
  return users.map(sanitizeUser);
}
