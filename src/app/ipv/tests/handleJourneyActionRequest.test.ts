import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";

describe("handleJourneyActionRequest", () => {
  const testReq = {
    id: "1",
    body: { journey: "next" },
    session: {
      ipvSessionId: "ipv-session-id",
      ipAddress: "ip-address",
      currentPage: "page-ipv-identity-document-start",
      save: sinon.fake.yields(null),
    },
    log: { info: sinon.fake(), error: sinon.fake() },
    params: { pageId: "page-ipv-identity-document-start" },
  } as any;

  const res = {
    status: sinon.fake(),
    redirect: sinon.fake(),
    send: sinon.fake(),
    render: sinon.fake(),
    log: { info: sinon.fake(), error: sinon.fake() },
    locals: { contactUsUrl: "contactUrl", deleteAccountUrl: "deleteAccount" },
  } as any;

  const next = sinon.fake();

  const coreBackServiceStub = {
    postJourneyEvent: sinon.stub(),
  };

  const middleware: typeof import("../middleware") = proxyquire(
    "../middleware",
    {
      "../../services/coreBackService": coreBackServiceStub,
    },
  );

  afterEach(() => {
    coreBackServiceStub.postJourneyEvent = sinon.stub();
  });

  it("should call next with error message given redirect url is missing from client event response", async function () {
    const clientEventResponse = {
      data: {
        client: {
          redirectUrl: undefined,
          authCode: "ABC123",
          state: "test-state",
        },
      },
    };

    const callBack = sinon.stub();
    coreBackServiceStub.postJourneyEvent = callBack;
    callBack.onCall(0).returns(clientEventResponse);

    await middleware.handleJourneyActionRequest(testReq, res, next);
    expect(next).to.have.been.calledWith(
      sinon.match.has("message", "Client Response redirect url is missing"),
    );
  });

  it("should call next with an error message given redirect url is missinf from CRI event response", async () => {
    const criEventResponse = {
      data: {
        cri: {
          id: "someId",
          redirectUrl: undefined,
        },
      },
    };

    const callBack = sinon.stub();
    coreBackServiceStub.postJourneyEvent = callBack;
    callBack.onCall(0).returns(criEventResponse);

    await middleware.handleJourneyActionRequest(testReq, res, next);
    expect(next).to.have.been.calledWith(
      sinon.match.has("message", "CRI response RedirectUrl is missing"),
    );
  });

  ["ukPassport", "drivingLicence", "end", "attempt-recovery"].forEach(
    (journey) => {
      it(`should postJourneyEvent when journey is "${journey}"`, async () => {
        const req = { ...testReq, body: { journey } };
        await middleware.handleJourneyActionRequest(req, res, next);
        expect(
          coreBackServiceStub.postJourneyEvent.firstCall,
        ).to.have.been.calledWith(req, journey, req.session.currentPage);
      });
    },
  );

  it("should postJourneyEvent with build-client-oauth-response and use ip address from header when not present in session", async function () {
    const req = {
      ...testReq,
      body: { journey: "build-client-oauth-response" },
      headers: { forwarded: "1.1.1.1" },
      session: { ...testReq.session, ipAddress: undefined },
    };

    await middleware.handleJourneyActionRequest(req, res, next);
    expect(
      coreBackServiceStub.postJourneyEvent.firstCall,
    ).to.have.been.calledWith(
      req,
      "build-client-oauth-response",
      "page-ipv-identity-document-start",
    );
  });

  it("should postJourneyEvent with build-client-oauth-response and use ip address from session when present", async function () {
    const req = {
      ...testReq,
      body: { journey: "build-client-oauth-response" },
      headers: { forwarded: "1.1.1.1" },
      session: { ...testReq.session, ipAddress: "some-ip-address" },
    };

    await middleware.handleJourneyActionRequest(req, res, next);
    expect(
      coreBackServiceStub.postJourneyEvent.firstCall,
    ).to.have.been.calledWith(
      req,
      "build-client-oauth-response",
      "page-ipv-identity-document-start",
    );
  });

  it("should call redirect given 'contact' event", async function () {
    const req = { ...testReq, body: { journey: "contact" } };

    await middleware.handleJourneyActionRequest(req, res, next);
    expect(res.redirect).to.have.been.calledWith("contactUrl");
  });

  it("should call redirect given 'deleteAccount' event", async function () {
    const req = { ...testReq, body: { journey: "deleteAccount" } };

    await middleware.handleJourneyActionRequest(req, res, next);
    expect(res.redirect).to.have.been.calledWith("deleteAccount");
  });

  it("should render the technical unrecoverable page given missing ipvSessionId from request", async () => {
    const req = {
      ...testReq,
      session: { ...testReq.session, ipvSessionId: undefined },
    };
    await middleware.handleJourneyActionRequest(req, res, next);
    expect(res.status).to.have.been.calledWith(401);
    expect(res.render).to.have.been.calledWith("ipv/page/pyi-technical.njk", {
      context: "unrecoverable",
    });
  });
});
