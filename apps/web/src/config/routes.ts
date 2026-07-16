// Centralized path constants so route strings aren't scattered/duplicated
// across nav configs, links, and redirects.
export const ROUTES = {
  home: "/",
  login: "/login",
  forgotPassword: "/forgot-password",
  health: "/health",
  admin: "/admin",
  business: "/business",
  waiter: "/waiter",
  cashier: "/cashier",
  kitchen: "/kitchen",
} as const;
