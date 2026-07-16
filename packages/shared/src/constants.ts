export const APP_NAMES = {
  WEB: "web",
  API: "api",
  WORKER: "worker",
} as const;

export type AppName = (typeof APP_NAMES)[keyof typeof APP_NAMES];

export const ENVIRONMENTS = {
  DEVELOPMENT: "development",
  TEST: "test",
  PRODUCTION: "production",
} as const;

export type Environment = (typeof ENVIRONMENTS)[keyof typeof ENVIRONMENTS];

export const API_VERSION_PREFIX = "/api/v1";
