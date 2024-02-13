const { expect } = require("chai");
const { kebabCaseToPascalCase } = require("./stringHelper");

describe("Kebab Case To Pascal Case", () => {
  it("Should handle standard kebab case", () => {
    const input = "no-photo-id";
    const expectedOutput = "NoPhotoId";

    const result = kebabCaseToPascalCase(input);

    expect(result).to.equal(expectedOutput);
  });

  it("Should handle already capitalized", () => {
    const input = "no-Photo-id";
    const expectedOutput = "NoPhotoId";

    const result = kebabCaseToPascalCase(input);

    expect(result).to.equal(expectedOutput);
  });

  it("Should handle already pascal case", () => {
    const input = "NoPhotoId";
    const expectedOutput = "NoPhotoId";

    const result = kebabCaseToPascalCase(input);

    expect(result).to.equal(expectedOutput);
  });

  it("Should handle camel case", () => {
    const input = "noPhotoId";
    const expectedOutput = "NoPhotoId";

    const result = kebabCaseToPascalCase(input);

    expect(result).to.equal(expectedOutput);
  });

  it("Should handle empty string", () => {
    const input = "";
    const expectedOutput = "";

    const result = kebabCaseToPascalCase(input);

    expect(result).to.equal(expectedOutput);
  });

  it("Should handle undefined", () => {
    let input;
    const expectedOutput = "";

    const result = kebabCaseToPascalCase(input);

    expect(result).to.equal(expectedOutput);
  });
});
