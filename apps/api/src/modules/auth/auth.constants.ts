export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

// Scoped narrowly to the refresh endpoint only - the browser never sends
// this cookie on ordinary requests, shrinking its exposure window.
export const REFRESH_TOKEN_COOKIE_PATH = "/api/v1/auth/refresh";
