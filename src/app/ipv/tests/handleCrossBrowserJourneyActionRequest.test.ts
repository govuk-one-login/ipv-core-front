import IPV_PAGES from "../../../constants/ipv-pages";
import sinon from "sinon";
import { expect } from "chai";
import {
  specifyCreateRequest,
  specifyCreateResponse,
} from "../../../test-utils/mock-express";
import proxyquire from "proxyquire";

describe("handleCrossBrowserJourneyActionRequest", () => {
  // Mock handler parameters
  const createRequest = specifyCreateRequest({
    session: {
      ipvSessionId: "ipv-session-id",
      ipAddress: "ip-address",
      save: sinon.fake.yields(null),
    },
  });
  const createResponse = specifyCreateResponse();

  // Setup stubs
  const coreBackServiceStub = {
    postJourneyEvent: sinon.stub(),
    postAction: sinon.fake(),
  };
  const middleware: typeof import("../middleware") = proxyquire(
    "../middleware",
    {
      "../../services/coreBackService": coreBackServiceStub,
    },
  );

  beforeEach(() => {
    coreBackServiceStub.postJourneyEvent.resetHistory();
    coreBackServiceStub.postAction.resetHistory();
  });

  it("should send build-client-oauth-response action to core-back", async () => {
    // Arrange
    const req = createRequest({
      params: { pageId: "cross-browser-problem" },
      session: {
        currentPage: "cross-browser-problem",
      },
    });
    const res = createResponse();
    coreBackServiceStub.postJourneyEvent.returns({
      data: { page: IPV_PAGES.PAGE_MULTIPLE_DOC_CHECK },
    });

    // Act
    await middleware.handleCrossBrowserJourneyActionRequest(
      req,
      res,
      sinon.fake,
    );

    // Assert
    expect(coreBackServiceStub.postJourneyEvent).to.have.been.calledWith(
      req,
      "build-client-oauth-response",
      IPV_PAGES.CROSS_BROWSER_PROBLEM,
    );
    expect(res.redirect).to.have.been.calledWith(
      `/ipv/page/${IPV_PAGES.PAGE_MULTIPLE_DOC_CHECK}`,
    );
  });

  it("should handle unexpected page", async () => {
    // Arrange
    const req = createRequest({
      params: { pageId: "cross-browser-problem" },
      session: {
        currentPage: "page-multiple-doc-check",
      },
    });
    const res = createResponse();

    // Act
    await middleware.handleCrossBrowserJourneyActionRequest(
      req,
      res,
      sinon.fake,
    );

    // Assert
    expect(res.redirect).to.have.been.calledWith(
      `/ipv/page/${IPV_PAGES.PYI_ATTEMPT_RECOVERY}`,
    );
  });
});
