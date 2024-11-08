import { expect } from "chai";
import sinon from "sinon";
import { validateFeatureSet } from "../middleware";
import {
  specifyCreateRequest,
  specifyCreateResponse,
} from "../../../test-utils/mock-express";

describe("validateFeatureSet", () => {
  // Mock handler parameters
  const createRequest = specifyCreateRequest();
  const createResponse = specifyCreateResponse();
  const next: any = sinon.fake();

  beforeEach(() => {
    next.resetHistory();
  });

  it("should call next if featureSet is valid", async () => {
    // Arrange
    const req = createRequest({
      query: { featureSet: "F01" },
    });
    const res = createResponse();

    // Act
    await validateFeatureSet(req, res, next);

    // Assert
    expect(req.session.featureSet).to.equal("F01");
    expect(next).to.have.been.calledOnce;
  });

  it("should call next if comma separated multiple featureSet is valid", async () => {
    // Arrange
    const req = createRequest({
      query: { featureSet: "F01,D01" },
    });
    const res = createResponse();

    // Act
    await validateFeatureSet(req, res, next);

    // Assert
    expect(req.session.featureSet).to.equal("F01,D01");
    expect(next).to.have.been.calledOnce;
  });

  [
    {
      scenario: "comma separated featureSet is invalid",
      featureSet: "F01, D01",
    },
    {
      scenario: "comma is not followed by text for featureSet",
      featureSet: "F01,",
    },
    { scenario: "empty featureSet is provided", featureSet: "" },
    { scenario: "blank featureSet is provided", featureSet: " " },
    { scenario: "featureSet is invalid", featureSet: "invalid-featureset" },
  ].forEach(({ scenario, featureSet }) => {
    it(`should throw an error if ${scenario}`, async () => {
      // Arrange
      const req = createRequest({ query: { featureSet } });
      const res = createResponse();

      // Act
      await validateFeatureSet(req, res, next);

      // Assert
      expect(next).to.have.been.calledWith(
        sinon.match
          .instanceOf(Error)
          .and(sinon.match.has("message", "Invalid feature set ID")),
      );
      expect(req.session.featureSet).to.be.undefined;
    });
  });
});
