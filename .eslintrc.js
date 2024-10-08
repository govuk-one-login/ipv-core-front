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
  extends: [
    "eslint:recommended",
    "prettier"],
  rules: {
    "no-console": 2,
    "padding-line-between-statements": [
      "error",
      { blankLine: "any", prev: "*", next: "*" },
    ],
  },
  overrides: [
    {
      files: ["**/*.ts"],
      plugins: ["@typescript-eslint"],
      extends: [
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
      ],
      "rules": {
        "@typescript-eslint/explicit-function-return-type": [
          "error",
          {
            "allowExpressions": true,
            "allowHigherOrderFunctions": true
          }
        ],
      },
    },
    {
      files: ["**/*.test.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off", // any is convenient for tests
        "@typescript-eslint/no-unused-expressions": "off", // chai assertions are often 'unused' expressions
      }
    }
  ],
};
