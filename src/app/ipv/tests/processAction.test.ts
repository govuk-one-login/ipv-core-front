import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";
import {
  IDENTIFY_DEVICE,
  PROVE_IDENTITY_NO_PHOTO_ID,
} from "../../../constants/ipv-pages";

describe("processAction", () => {
  const testReq = {
    id: "1",
    url: "/journey/next",
    session: {
      ipvSessionId: "ipv-session-id",
      ipAddress: "ip-address",
      save: sinon.fake.yields(null),
    },
    log: { info: sinon.fake(), error: sinon.fake() },
  } as any;

  const res = {
    status: sinon.fake(),
    redirect: sinon.fake(),
    send: sinon.fake(),
    render: sinon.fake(),
    log: { info: sinon.fake(), error: sinon.fake() },
    locals: { contactUsUrl: "contactUrl", deleteAccountUrl: "deleteAccount" },
  } as any;

  const coreBackServiceStub = {
    postJourneyEvent: sinon.spy(),
    postAction: sinon.fake(),
  };

  const middleware: typeof import("../middleware") = proxyquire(
    "../middleware",
    {
      "../../services/coreBackService": coreBackServiceStub,
    },
  );

  beforeEach(() => {
    coreBackServiceStub.postJourneyEvent = sinon.spy();
    coreBackServiceStub.postAction = sinon.fake();
  });

  it("should throw an error when receiving an unexpected backend response", async function () {
    const eventResponse = {
      data: {
        test: "unknown-response",
      },
    };

    const callBack = sinon.stub();
    coreBackServiceStub.postAction = callBack;

    callBack.onCall(0).returns(eventResponse);

    expect(
      middleware.processAction(testReq, res, "/journey/next"),
    ).to.be.rejectedWith("Unexpected backend response");
  });

  it("should send an appTriage event to core-back and then handle identify-device page response", async function () {
    const pageId = PROVE_IDENTITY_NO_PHOTO_ID;
    const eventResponses = [
      {
        data: { page: IDENTIFY_DEVICE },
      },
      {
        data: { page: pageId },
      },
    ];

    const callBack = sinon.stub();
    coreBackServiceStub.postJourneyEvent = callBack;

    eventResponses.forEach((er, index) => {
      callBack.onCall(index).returns(eventResponses[index]);
    });

    const req = { ...testReq, headers: { "user-agent": "Not mobile device" } };

    await middleware.processAction(req, res, "next");

    expect(
      coreBackServiceStub.postJourneyEvent.getCall(0),
    ).to.have.been.calledWith(req, "next");
    expect(
      coreBackServiceStub.postJourneyEvent.getCall(1),
    ).to.have.been.calledWith(req, "appTriage");

    expect(res.redirect).to.have.been.calledWith(`/ipv/page/${pageId}`);
  });

  it("should have called postJourneyEvent in the correct sequence", async function () {
    const pageId = "pageProvenIdentityUserDetailsTransition";
    const eventResponses = [
      {
        data: { journey: "next" },
      },
      {
        data: { journey: "startCri" },
      },
      {
        data: { page: pageId },
      },
    ];

    const callBack = sinon.stub();
    coreBackServiceStub.postJourneyEvent = callBack;

    eventResponses.forEach((er, index) => {
      callBack.onCall(index).returns(eventResponses[index]);
    });

    await middleware.processAction(testReq, res, "next");
    expect(
      coreBackServiceStub.postJourneyEvent.getCall(0),
    ).to.have.been.calledWith(testReq, "next");
    expect(
      coreBackServiceStub.postJourneyEvent.getCall(1),
    ).to.have.been.calledWith(testReq, "next");
    expect(
      coreBackServiceStub.postJourneyEvent.getCall(2),
    ).to.have.been.calledWith(testReq, "startCri");

    expect(res.redirect).to.have.been.calledWith(`/ipv/page/${pageId}`);
  });

  it("should set the status code of the page if provided", async function () {
    const callBack = sinon.stub();
    callBack
      .onFirstCall()
      .returns({ data: { page: "a-page-id", statusCode: 418 } });
    coreBackServiceStub.postJourneyEvent = callBack;

    await middleware.processAction(testReq, res, "next");

    expect(coreBackServiceStub.postJourneyEvent).to.have.been.calledWith(
      testReq,
      "next",
    );

    expect(testReq.session.currentPageStatusCode).to.equal(418);
    expect(res.redirect).to.have.been.calledWith(`/ipv/page/a-page-id`);
  });

  it("should be redirected to a valid redirectURL given a valid CRI event response", async function () {
    const request =
      "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJkYXRlT2ZCaXJ0aHMiOltdLCJhZGRyZXNzZXMiOltdLCJuYW1lcyI6W10sImFkZHJlc3NIaXN0b3J5IjpbXX0.DwQQOldmOYQ1Lv6OJETzks7xv1fM7VzW0O01H3-uQqQ_rSkCZrd2KwQHHzo0Ddw2K_LreePy-tEr-tiPgi8Yl604n3rwQy6xBat8mb4lTtNnOxsUOYviYQxC5aamsvBAS27G43wFejearXHWzEqhJhIFdGE4zJkgZAKpLGzvOXLvX4NZM4aI4c6jMgpktkvvFey-O0rI5ePh5RU4BjbG_hvByKNlLr7pzIlsS-Q8KuIPawqFJxN2e3xfj1Ogr8zO0hOeDCA5dLDie78sPd8ph0l5LOOcGZskd-WD74TM6XeinVpyTfN7esYBnIZL-p-qULr9CUVIPCMxn-8VTj3SOw=="; // pragma: allowlist secret
    const responseType = "code";
    const clientId = "test-client-id";
    const redirectUrl = "https://someurl.com";

    const callBack = sinon.stub();
    coreBackServiceStub.postJourneyEvent = callBack;

    callBack.onCall(0).returns({
      data: {
        cri: {
          id: "someid",
          redirectUrl: `${redirectUrl}?client_id=${clientId}&request=${request}&response_type=${responseType}`,
        },
      },
    });

    await middleware.processAction(testReq, res, "next");
    expect(res.redirect).to.have.been.calledWith(
      `${redirectUrl}?client_id=${clientId}&request=${request}&response_type=${responseType}`,
    );
  });

  it("should be redirected to a valid Client URL given a valid Client event response", async function () {
    const redirectUrl = "https://someurl.org";
    const callBack = sinon.stub();

    coreBackServiceStub.postJourneyEvent = callBack;

    callBack.onCall(0).returns({
      data: { client: { redirectUrl: redirectUrl } },
    });

    const req = {
      ...testReq,
      session: {
        ...testReq.session,
        clientOauthSessionId: "fake-client-session",
      },
    };
    await middleware.processAction(req, res, "next");

    expect(res.redirect).to.be.calledWith(`${redirectUrl}`);
    expect(req.session.clientOauthSessionId).to.be.undefined;
  });
});
