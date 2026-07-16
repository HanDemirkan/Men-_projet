const baseConfig = require("@qr-platform/config/eslint/base");

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  ...baseConfig,
  { ignores: [".next/**"] },
  {
    languageOptions: { globals: { process: "readonly", window: "readonly", document: "readonly" } },
  },
];
