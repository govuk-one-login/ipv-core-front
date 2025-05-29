import {
  specifyCreateRequest,
  specifyCreateResponse,
} from "../../../test-utils/mock-express";
import sinon from "sinon";
import { validatePageId } from "../middleware";
import { expect } from "chai";
import NotFoundError from "../../../errors/not-found-error";

const createRequest = specifyCreateRequest();
const createResponse = specifyCreateResponse();

describe("validatePageId", () => {
  it("should throw if invalid pageId is provided", () => {
    // Arrange
    const req = createRequest({ params: { pageId: "unkownPageId" } });
    const res = createResponse();
    const next = sinon.fake();

    // Act/Assert
    expect(() => validatePageId(req, res, next)).to.throw(
      NotFoundError,
      "Invalid page id",
    );
  });

  it("should throw if invalid pageId is provided", () => {
    // Arrange
    const req = createRequest({ params: { pageId: "live-in-uk" } });
    const res = createResponse();
    const next = sinon.fake();

    // Act
    validatePageId(req, res, next);

    // Assert
    expect(next).to.have.been.calledOnce;
  });
});
