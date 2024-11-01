import { expect } from "chai";
import { kebabCaseToPascalCase } from "./stringHelper";

describe("Kebab Case To Pascal Case", () => {
  const testCases = [
    {
      scenario: "standard kebab-case",
      input: "no-photo-id",
      expectedOutput: "NoPhotoId",
    },
    {
      scenario: "already capitalized",
      input: "no-Photo-id",
      expectedOutput: "NoPhotoId",
    },
    {
      scenario: "already pascal case",
      input: "NoPhotoId",
      expectedOutput: "NoPhotoId",
    },
    {
      scenario: "already camel-case",
      input: "noPhotoId",
      expectedOutput: "NoPhotoId",
    },
    { scenario: "empty string", input: "", expectedOutput: "" },
    { scenario: "undefined", input: undefined, expectedOutput: "" },
  ];

  testCases.forEach(({ scenario, input, expectedOutput }) => {
    it(`should set the journey to ${scenario}`, () => {
      const result = kebabCaseToPascalCase(input as any);
      expect(result).to.equal(expectedOutput);
    });
  });
});