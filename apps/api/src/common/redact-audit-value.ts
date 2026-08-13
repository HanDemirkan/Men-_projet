const SENSITIVE_KEY_PATTERN = /password|secret|token|hash/i;

// Defense in depth: nothing sensitive is ever written into oldValue/newValue
// by the services that call AuditService.log() (see AdminTenantsService's/
// BusinessUsersService's tenant-create entries, which deliberately omit raw
// passwords). This masks any field whose *name* looks sensitive anyway, the
// same idea as pino's `redact` config for application logs
// (logger.module.ts) - a second, independent layer in case a future caller
// isn't as careful. Shared by the admin and business modules' audit log
// screens.
export function redactAuditValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactAuditValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? "[REDACTED]" : redactAuditValue(entryValue),
      ]),
    );
  }

  return value;
}

export function redactAuditLog<T extends { oldValue: unknown; newValue: unknown }>(log: T): T {
  return { ...log, oldValue: redactAuditValue(log.oldValue), newValue: redactAuditValue(log.newValue) };
}
