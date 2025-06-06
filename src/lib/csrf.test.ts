import { Request } from "express";
import { getTokenFromRequest } from "./csrf";
import BadRequestError from "../errors/bad-request-error";

describe("getTokenFromRequest", () => {
  it("should return csrf token from request body", () => {
    const testRequest = { body: { _csrf: "csrf-token" } } as unknown as Request;

    const token = getTokenFromRequest(testRequest);

    expect(token).to.equal("csrf-token");
  });

  it("should throw BadRequest error when missing request body", () => {
    const testRequest = {} as unknown as Request;

    expect(() => getTokenFromRequest(testRequest)).to.throw(
      BadRequestError,
      "Missing request body",
    );
  });
});
