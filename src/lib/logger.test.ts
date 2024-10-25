import { redactQueryParams } from "./logger";

describe("redactQueryParams", () => {
  [
    {
      input: undefined,
      output: undefined,
    },
    {
      input: "malformed",
      output: "malformed",
    },
    {
      input: "http://example.com/authorize",
      output: "http://example.com/authorize",
    },
    {
      input: "http://example.com/authorize?safe=value",
      output: "http://example.com/authorize?safe=value",
    },
    {
      input:
        "http://example.com/authorize?code=secret_code&safe=value&request=long_request",
      output:
        "http://example.com/authorize?code=hidden&safe=value&request=hidden",
    },
  ].forEach(({ input, output }) => {
    it(`should correctly map ${input}`, () => {
      const actual = redactQueryParams(input);
      expect(actual).to.equal(output);
    });
  });
});
