import { expect } from "chai";
import { getPhoneType } from "./contextHelper";
import { PHONE_TYPES } from "../../constants/device-constants";

describe("getPhoneType", () => {
  it("should return iphone for plain iphone context", () => {
    expect(getPhoneType("iphone")).to.equal(PHONE_TYPES.IPHONE);
  });

  it("should return android for plain android context", () => {
    expect(getPhoneType("android")).to.equal(PHONE_TYPES.ANDROID);
  });

  [
    "iphone-appOnly",
    "iphone-something",
    "android-appOnly",
    "android-14",
  ].forEach((context) => {
    it(`should normalize and return correct phone type for context: ${context}`, () => {
      const expected = context.startsWith("iphone")
        ? PHONE_TYPES.IPHONE
        : PHONE_TYPES.ANDROID;
      expect(getPhoneType(context)).to.equal(expected);
    });
  });

  [null, undefined].forEach((context) => {
    it(`should throw a TechnicalError for invalid or missing context: ${context}`, () => {
      expect(() => getPhoneType(context as any)).to.throw(
        `Invalid phone type context: ${context}`,
      );
    });
  });

  ["invalid-context", "desktop", "ipxone"].forEach((context) => {
    it(`should throw a TechnicalError for unrecognised phone type: ${context}`, () => {
      expect(() => getPhoneType(context as any)).to.throw(
        `Unrecognised phone type: ${context}`,
      );
    });
  });
});
