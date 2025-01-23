const tsEslint = require('typescript-eslint');
const eslint = require('@eslint/js');
const prettierConfig = require("eslint-config-prettier");
const {node, es6, es2020, mocha, browser} =  require('globals');

module.exports = tsEslint.config(
  eslint.configs.recommended,
  prettierConfig,
  {

    languageOptions: {
      globals: {
        ...node,
        ...es6,
        ...es2020,
        ...mocha,
        ...browser,
        sinon: true,
        expect: true,
      }
    },

    ignores: ['wallaby.conf.js', 'dist'],

    rules: {
      "no-console": 2,
      "padding-line-between-statements": [
        "error",
        { blankLine: "any", prev: "*", next: "*" },
      ],
    }
  },
  {
    files: ["**/*.ts"],
    extends: [ tsEslint.configs.eslintRecommended, tsEslint.configs.recommended ],
    rules: {
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
);
