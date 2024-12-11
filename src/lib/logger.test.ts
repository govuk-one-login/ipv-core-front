import sinon from "sinon";
import { generateRequestId, redactQueryParams } from "./logger";

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
    {
      input: "/authorize?code=secret_code&safe=value&request=long_request",
      output: "/authorize?code=hidden&safe=value&request=hidden",
    },
  ].forEach(({ input, output }) => {
    it(`should correctly map ${input}`, () => {
      // Act
      const actual = redactQueryParams(input);

      // Assert
      expect(actual).to.equal(output);
    });
  });
});

describe("generateRequestId", () => {
  it("reuses existing request id from express", () => {
    const req = {
      id: "test-id",
    } as any;
    const res = {} as any;

    const requestId = generateRequestId(req, res);

    expect(requestId).to.equal("test-id");
  });

  it("reuses existing request id from header", () => {
    const req = {
      get: (header: string) =>
        header === "x-request-id" ? "test-id" : undefined,
    } as any;
    const res = {} as any;

    const requestId = generateRequestId(req, res);

    expect(requestId).to.equal("test-id");
  });

  it("generates a new id and populates response header", () => {
    const req = {
      get: () => undefined,
    } as any;
    const res = {
      header: sinon.fake(),
    } as any;

    const requestId = generateRequestId(req, res);

    expect(requestId).to.be.ok;
    expect(res.header).to.be.calledWith("x-request-id", requestId);
  });
});
