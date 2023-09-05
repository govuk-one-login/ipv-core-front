module.exports = {
  env: {
    node: true,
    es6: true,
    es2020: true,
    mocha: true,
    browser: true
  },
  globals: {
    sinon: true,
    expect: true,
  },
  root: true,
  extends: ["eslint:recommended", "prettier","plugin:jsonc/recommended-with-jsonc"],
  rules: {
    "no-console": 2,
    "padding-line-between-statements": [
      "error",
      { blankLine: "any", prev: "*", next: "*" },
    ],
  },
  overrides: [
    {
      files: ["*.json"],
      parser: "jsonc-eslint-parser",
    },
  ],
};
