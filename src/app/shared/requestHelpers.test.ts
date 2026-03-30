import { expect } from "chai";
import { parseQueryValue } from "./requestHelpers";

describe("parseQueryValue", () => {
  [
    {
      scenario: "value is a non-empty string",
      testValue: "queryParamValue",
      expectedParsedValue: "queryParamValue",
    },
    {
      scenario: "value is an empty string",
      testValue: "",
      expectedParsedValue: true,
    },
    {
      scenario: "value is a string with value 'true'",
      testValue: "true",
      expectedParsedValue: true,
    },
    {
      scenario: "value is a string with value 'false'",
      testValue: "false",
      expectedParsedValue: false,
    },
    {
      scenario: "value is undefined",
      testValue: undefined,
      expectedParsedValue: undefined,
    },
  ].forEach(({ scenario, testValue, expectedParsedValue }) => {
    it(`should return ${expectedParsedValue} given ${scenario}`, () => {
      expect(parseQueryValue(testValue)).to.eq(expectedParsedValue);
    });
  });
});
