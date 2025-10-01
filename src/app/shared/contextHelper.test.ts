import { expect } from "chai";
import { validatePhoneType } from "./contextHelper";

describe("validatePhoneType", () => {
  [
    "iphone",
    "android",
    "iphone-appOnly",
    "android-appOnly",
  ].forEach((context) => {
    it(`should not throw given context is valid: ${context}`, () => {
      expect(() => validatePhoneType(context as any)).not.to.throw();
    });
  });

  [null, undefined, "invalid-context", "desktop", "iphoneX"].forEach((context) => {
    it(`should throw an error given context is ${context}`, () => {
      expect(() => validatePhoneType(context as any)).to.throw(
        `Context cannot be parsed as a phone type: ${context}`,
      );
    });
  });
});
