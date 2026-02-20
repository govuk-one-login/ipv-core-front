import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";
import IPV_PAGES from "../../../constants/ipv-pages";
import {
  specifyCreateRequest,
  specifyCreateResponse,
} from "../../../test-utils/mock-express";
import { HttpStatusCode } from "axios";

describe("processAction", () => {
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

  it("should throw an error when receiving an unexpected backend response", async function () {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    coreBackServiceStub.postAction = sinon.fake.yields({
      data: {
        test: "unknown-response",
      },
    });

    // Act and Assert
    expect(
      middleware.processAction(req, res, "/journey/next"),
    ).to.be.rejectedWith("Unexpected backend response");
  });

  it("should send an appTriage event to core-back and then handle identify-device page response", async function () {
    // Arrange
    const req = createRequest({
      headers: { "user-agent": "Not mobile device" },
    });
    const res = createResponse();
    const pageId = IPV_PAGES.PROVE_IDENTITY_NO_PHOTO_ID;
    [
      {
        data: { page: IPV_PAGES.IDENTIFY_DEVICE },
      },
      {
        data: { page: pageId },
      },
    ].forEach((response, index) => {
      coreBackServiceStub.postJourneyEvent.onCall(index).returns(response);
    });

    // Act
    await middleware.processAction(req, res, "next");

    // Assert
    expect(coreBackServiceStub.postJourneyEvent).to.have.been.calledTwice;
    expect(
      coreBackServiceStub.postJourneyEvent.getCall(0),
    ).to.have.been.calledWith(req, "next");
    expect(
      coreBackServiceStub.postJourneyEvent.getCall(1),
    ).to.have.been.calledWith(req, "appTriage");
    expect(res.redirect).to.have.been.calledOnceWith(`/ipv/page/${pageId}`);
  });

  it("should have called postJourneyEvent in the correct sequence", async function () {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    const pageId = "pageProvenIdentityUserDetailsTransition";
    [
      {
        data: { journey: "next" },
      },
      {
        data: { journey: "startCri" },
      },
      {
        data: { page: pageId },
      },
    ].forEach((response, index) => {
      coreBackServiceStub.postJourneyEvent.onCall(index).returns(response);
    });

    // Act
    await middleware.processAction(req, res, "next");

    // Assert
    expect(coreBackServiceStub.postJourneyEvent).to.have.been.calledThrice;
    expect(
      coreBackServiceStub.postJourneyEvent.getCall(0),
    ).to.have.been.calledWith(req, "next");
    expect(
      coreBackServiceStub.postJourneyEvent.getCall(1),
    ).to.have.been.calledWith(req, "next");
    expect(
      coreBackServiceStub.postJourneyEvent.getCall(2),
    ).to.have.been.calledWith(req, "startCri");

    expect(res.redirect).to.have.been.calledOnceWith(`/ipv/page/${pageId}`);
  });

  it("should set the status code of the page if provided", async function () {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    coreBackServiceStub.postJourneyEvent.onFirstCall().returns({
      data: { page: "a-page-id", statusCode: HttpStatusCode.ImATeapot },
    });

    // Act
    await middleware.processAction(req, res, "next");

    // Assert
    expect(coreBackServiceStub.postJourneyEvent).to.have.been.calledOnceWith(
      req,
      "next",
    );
    expect(req.session.currentPageStatusCode).to.equal(
      HttpStatusCode.ImATeapot,
    );
    expect(res.redirect).to.have.been.calledOnceWith(`/ipv/page/a-page-id`);
  });

  it("should be redirected to a valid redirectURL given a valid CRI event response", async function () {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    const request = "some-request";
    const responseType = "code";
    const clientId = "test-client-id";
    const redirectUrl = "https://someurl.com";
    coreBackServiceStub.postJourneyEvent.onFirstCall().returns({
      data: {
        cri: {
          id: "someid",
          redirectUrl: `${redirectUrl}?client_id=${clientId}&request=${request}&response_type=${responseType}`,
        },
      },
    });

    // Act
    await middleware.processAction(req, res, "next");

    // Assert
    expect(res.redirect).to.have.been.calledOnceWith(
      `${redirectUrl}?client_id=${clientId}&request=${request}&response_type=${responseType}`,
    );
  });

  it("should be redirected to a valid Client URL given a valid Client event response", async function () {
    // Arrange
    const req = createRequest({
      session: {
        clientOauthSessionId: "fake-client-session",
      },
    });
    const res = createResponse();
    const redirectUrl = "https://someurl.org";
    coreBackServiceStub.postJourneyEvent.onCall(0).returns({
      data: { client: { redirectUrl } },
    });

    // Act
    await middleware.processAction(req, res, "next");

    // Assert
    expect(res.redirect).to.be.calledWith(redirectUrl);
    expect(req.session.clientOauthSessionId).to.be.undefined;
  });
});
