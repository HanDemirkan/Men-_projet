const baseConfig = require("@qr-platform/config/eslint/base");

/** @type {import("eslint").Linter.Config[]} */
module.exports = [...baseConfig, { ignores: ["generated/**"] }];
