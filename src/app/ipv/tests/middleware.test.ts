import { expect } from "chai";
import sinon from "sinon";
import {
  renderAttemptRecoveryPage,
  renderProblemDifferentBrowserPage,
  renderFeatureSetPage,
  setRequestPageId,
  staticPageMiddleware,
} from "../middleware";
import {
  specifyCreateRequest,
  specifyCreateResponse,
} from "../../../test-utils/mock-express";

describe("journey middleware", () => {
  // Mock handler parameters
  const createRequest = specifyCreateRequest({
    params: { pageId: "page-ipv-identity-document-start" },
    session: {
      ipvSessionId: "ipv-session-id",
      ipAddress: "ip-address",
      featureSet: "feature-set",
      save: sinon.fake.yields(null),
    },
  });
  const createResponse = specifyCreateResponse();
  const next: any = sinon.fake();

  context("setRequestPageId", () => {
    it("should return a handler that sets the page ID on a request", async function () {
      // Arrange
      const req = createRequest();
      const res = createResponse();
      const newPageId = "new-page-id";
      const handler = setRequestPageId(newPageId);

      // Act
      await handler(req, res, next);

      // Assert
      expect(req.params.pageId).to.equal(newPageId);
      expect(next).to.have.been.called;
    });
  });

  context("renderAttemptRecoveryPage", () => {
    it("should render attempt recovery page", () => {
      // Arrange
      const req = createRequest();
      const res = createResponse();

      // Act
      renderAttemptRecoveryPage(req, res);

      // Assert
      expect(res.render).to.have.been.calledOnceWith(
        "ipv/page/pyi-attempt-recovery.njk",
      );
    });
  });

  context("staticPageMiddleware", () => {
    it("should render static document type page", () => {
      // Arrange
      const req = createRequest();
      const res = createResponse();
      const handler = staticPageMiddleware("page-ipv-identity-document-types");

      // Act
      handler(req, res);

      // Assert
      expect(res.render).to.have.been.calledOnceWith(
        "ipv/page/page-ipv-identity-document-types.njk",
      );
    });
  });

  context("renderFeatureSetPage", () => {
    it("should render featureSet page", () => {
      // Arrange
      const req = createRequest();
      const res = createResponse();

      // Act
      renderFeatureSetPage(req, res);

      // Assert
      expect(res.render).to.have.been.calledOnceWith("ipv/page-featureset.njk");
    });
  });

  context("renderProblemDifferentBrowserPage", () => {
    it("should render the problem-different-browser page", () => {
      // Arrange
      const req = createRequest();
      const res = createResponse();

      // Act
      renderProblemDifferentBrowserPage(req, res);

      // Assert
      expect(res.render).to.have.been.calledOnceWith(
        "ipv/page/problem-different-browser.njk",
        {
          pageId: "problem-different-browser",
          csrfToken: undefined,
        },
      );
    });
  });
});
