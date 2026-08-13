import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

// Marks a route as not requiring authentication. JwtAuthGuard (global)
// checks this before rejecting a request with no resolved user.
export const Public = (): ReturnType<typeof SetMetadata> => SetMetadata(IS_PUBLIC_KEY, true);
