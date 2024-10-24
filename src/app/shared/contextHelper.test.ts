import { expect } from "chai";
import { validatePhoneType } from "./contextHelper";

describe("parseContextAsPhoneType", () => {
  const validCases = ["iphone", "android"];
  validCases.forEach((context) => {
    it(`should not throw given context is valid: ${context}`, () => {
      expect(() => validatePhoneType(context as any)).not.to.throw(
        `Context cannot be parsed as a phone type: ${context}`,
      );
    });
  });

  const errorCases = [null, undefined, "invalid-context"];
  errorCases.forEach((context) => {
    it(`should throw and error given context is ${context}`, () => {
      expect(() => validatePhoneType(context as any)).to.throw(
        `Context cannot be parsed as a phone type: ${context}`,
      );
    });
  });
});
