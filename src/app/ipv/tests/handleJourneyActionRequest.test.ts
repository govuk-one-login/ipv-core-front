import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";
import UnauthorizedError from "../../../errors/unauthorized-error";
import {
  specifyCreateRequest,
  specifyCreateResponse,
} from "../../../test-utils/mock-express";

describe("handleJourneyActionRequest", () => {
  // Mock handler parameters
  const createRequest = specifyCreateRequest({
    body: { journey: "next" },
    session: {
      ipvSessionId: "ipv-session-id",
      ipAddress: "ip-address",
      currentPage: "page-ipv-identity-document-start",
      save: sinon.fake.yields(null),
    },
    params: { pageId: "page-ipv-identity-document-start" },
  });
  const createResponse = specifyCreateResponse();
  const next: any = sinon.fake();

  // Setup stubs
  const coreBackServiceStub = { postJourneyEvent: sinon.stub() };
  const middleware: typeof import("../middleware") = proxyquire(
    "../middleware",
    {
      "../../services/coreBackService": coreBackServiceStub,
    },
  );

  beforeEach(() => {
    next.resetHistory();
    coreBackServiceStub.postJourneyEvent.reset();
  });

  it("should call next with error message if client event response lacks redirect URL", async function () {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    coreBackServiceStub.postJourneyEvent.resolves({
      data: {
        client: {
          redirectUrl: undefined,
          authCode: "ABC123",
          state: "test-state",
        },
      },
    });

    // Act
    await middleware.handleJourneyActionRequest(req, res, next);

    // Assert
    await expect(
      (async () =>
        await middleware.handleJourneyActionRequest(testReq, res, next))(),
    ).to.be.rejectedWith(Error, "Client Response redirect url is missing");
  });

  it("should call next with error message if CRI event response lacks redirect URL", async function () {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    coreBackServiceStub.postJourneyEvent.resolves({
      data: { cri: { id: "someId", redirectUrl: undefined } },
    });

    // Act
    await middleware.handleJourneyActionRequest(req, res, next);

    // Assert
    await expect(
      (async () =>
        await middleware.handleJourneyActionRequest(testReq, res, next))(),
    ).to.be.rejectedWith(Error, "CRI response RedirectUrl is missing");
  });

  it(`should postJourneyEvent when given a journey event"`, async () => {
    // Arrange
    const req = createRequest({ body: { journey: "some-journey-event" } });
    const res = createResponse();

    // Act & Assert
    await expect(middleware.handleJourneyActionRequest(req, res, next)).to.be.rejectedWith(Error, "Test error");
    expect(coreBackServiceStub.postJourneyEvent).to.have.been.calledOnceWithExactly(
      req,
      "some-journey-event",
      req.session.currentPage
    );
  });

  it("should postJourneyEvent and use ip address from header when not present in session", async function () {
    // Arrange
    const req = createRequest({
      headers: { forwarded: "1.1.1.1" },
      session: { ipAddress: undefined },
    });
    const res = createResponse();

    // Act & Assert
    await expect(middleware.handleJourneyActionRequest(req, res, next)).to.be.rejectedWith(Error, "Test error");
    expect(coreBackServiceStub.postJourneyEvent).to.have.been.calledOnceWithExactly(
      req,
      "some-journey-event",
      req.session.currentPage
    );
  });

  it("should postJourneyEvent and use ip address from session when present", async function () {
    // Arrange
    const req = createRequest({ session: { ipAddress: "some-ip-address" } });
    const res = createResponse();

    // Act & Assert
    await expect(middleware.handleJourneyActionRequest(req, res, next)).to.be.rejectedWith(Error, "Test error");
    expect(coreBackServiceStub.postJourneyEvent).to.have.been.calledOnceWithExactly(
      req,
      "some-journey-event",
      req.session.currentPage
    );
  });

  it("should use session IP if present", async function () {
    // Arrange
    const req = createRequest({ session: { ipAddress: "some-ip-address" } });
    const res = createResponse();

    // Act
    await middleware.handleJourneyActionRequest(req, res, next);

    // Assert
    expect(coreBackServiceStub.postJourneyEvent).to.have.been.calledWith(
      req,
      req.body.journey,
      req.session.currentPage,
    );
  });

  const redirectTests = [
    { journey: "contact", expectedRedirect: "contactUrl" },
    { journey: "deleteAccount", expectedRedirect: "deleteAccount" },
  ];

  redirectTests.forEach(({ journey, expectedRedirect }) => {
    it(`should redirect to ${expectedRedirect} for journey ${journey}`, async function () {
      // Arrange
      const req = createRequest({ body: { journey } });
      const res = createResponse();

      // Act
      await middleware.handleJourneyActionRequest(req, res, next);

      // Assert
      expect(res.redirect).to.have.been.calledWith(expectedRedirect);
    });
  });

  it("should render technical error page if ipvSessionId is missing", async () => {
    // Arrange
    const req = createRequest({ session: { ipvSessionId: undefined } });
    const res = createResponse();

    // Act & Assert
    await expect(middleware.handleJourneyActionRequest(req, res, next)).to.be.rejectedWith(UnauthorizedError);
  });
});
