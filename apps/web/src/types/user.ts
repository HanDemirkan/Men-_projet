import type { Role } from "@qr-platform/permissions";

// Display-only shape for the UI shell (profile menu, avatar initials). Not a
// real session/auth model - Sprint 1 has no authentication.
export interface MockUser {
  name: string;
  email: string;
  role: Role;
  initials: string;
}
