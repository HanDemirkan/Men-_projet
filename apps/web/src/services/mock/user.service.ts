import type { Role } from "@qr-platform/permissions";

import { getMockUser } from "@/fixtures/user.fixture";
import type { MockUser } from "@/types/user";

// Thin service boundary over the fixture data. Kept separate from
// `fixtures/` on purpose: when real authentication lands, only this file's
// implementation changes (e.g. reads from a session instead), callers stay
// the same.
export function getCurrentUser(role: Role): MockUser {
  return getMockUser(role);
}
