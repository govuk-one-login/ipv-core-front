import { expect } from "chai";
import sinon from "sinon";
import { saveSessionAndRedirect } from "./redirectHelper";
import {
  specifyCreateRequest,
  specifyCreateResponse,
} from "../../test-utils/mock-express";

describe("saveSessionAndRedirect", () => {
  // Mock handler parameters
  const createRequest = specifyCreateRequest({
    session: {
      save: sinon.fake.yields(null),
    },
  });
  const createResponse = specifyCreateResponse();

  it("should redirect to given URL", async () => {
    // Arrange
    const req = createRequest();
    const res = createResponse();

    // Act
    await saveSessionAndRedirect(req, res, "/somewhere");

    // Assert
    expect(req.session.save).to.have.been.calledOnce;
    expect(res.redirect).to.have.been.calledOnceWith("/somewhere");
  });

  it("should throw if saving session encounters error", async () => {
    // Arrange
    const error = new Error("Something went wrong saving session");
    const req = createRequest({
      session: {
        save: sinon.fake.yields(error),
      },
    });
    const res = createResponse();

    // Act & Assert
    await expect(
      saveSessionAndRedirect(req, res, "/somewhere"),
    ).to.be.rejectedWith(error);
    expect(res.redirect).not.to.have.been.called;
  });
});
