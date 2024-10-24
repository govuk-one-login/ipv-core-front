import { expect } from "chai";
import { parseContextAsPhoneType } from "./contextHelper";

describe("parseContextAsPhoneType", () => {
  const validCases = [
    { context: "iphone", expectedContext: "iphone" },
    { context: "android", expectedContext: "android" },
  ];
  validCases.forEach(({ context, expectedContext }) => {
    it(`should return ${expectedContext} given context ${context}`, () => {
      const res = parseContextAsPhoneType(context);
      expect(res).to.equal(expectedContext);
    });
  });

  const errorCases = [null, undefined, "invalid-context"];
  errorCases.forEach((context) => {
    it(`should throw and error given context is ${context}`, () => {
      expect(() => parseContextAsPhoneType(context as any)).to.throw(
        `Context cannot be parsed as a phone type: ${context}`,
      );
    });
  });
});
