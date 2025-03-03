import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";
import { Request, Response } from "express";
import * as coreBackService from "../../services/coreBackService";
import * as postJourneyEventResponse from "../validators/postJourneyEventResponse";

const isAxiosErrorStub = sinon.stub().returns(true);
proxyquire("./middleware", {
  axios: { isAxiosError: isAxiosErrorStub },
});

const middleware: typeof import("./middleware") = proxyquire("./middleware", {
  axios: { isAxiosError: isAxiosErrorStub },
});

describe("vc receipt status middleware tests", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: any;
  let appVcReceivedStub: sinon.SinonStub;
  let isJourneyResponse: sinon.SinonStub;

  beforeEach(() => {
    req = {
      session: {} as any,
    };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };
    next = sinon.stub();
    appVcReceivedStub = sinon.stub(coreBackService, "appVcReceived");
    isJourneyResponse = sinon.stub(
      postJourneyEventResponse,
      "isJourneyResponse",
    );
  });

  afterEach(() => {
    sinon.restore();
  });

  it("pollVcReceiptStatus should return PROCESSING status if appVcReceived returns 404", async () => {
    const error = { response: { status: 404 } };
    appVcReceivedStub.rejects(error);

    await middleware.pollVcReceiptStatus(req as Request, res as Response, next);

    expect(res.status).to.have.been.calledWith(200);
    expect(res.json).to.have.been.calledWith({ status: "PROCESSING" });
  });

  it("pollVcReceiptStatus should return COMPLETED status on successful appVcReceived", async () => {
    appVcReceivedStub.resolves({ data: { journey: "journey/next" } });
    isJourneyResponse.returns(true);

    await middleware.pollVcReceiptStatus(req as Request, res as Response, next);

    expect(res.status).to.have.been.calledWith(200);
    expect(res.json).to.have.been.calledWith({ status: "COMPLETED" });
    expect((req.session as any).journey).to.equal("journey/next");
  });

  it("pollVcReceiptStatus should return an error when appVcReceived does not return journey response", async () => {
    appVcReceivedStub.resolves({ data: {} });
    isJourneyResponse.returns(false);

    await middleware.pollVcReceiptStatus(req as Request, res as Response, next);

    expect(res.status).to.have.been.calledWith(500);
    expect(res.json).to.have.been.calledWith({ status: "ERROR" });
  });

  it("pollVcReceiptStatus should return ERROR status if appVcReceived throws non 404 error", async () => {
    const error = new Error("Test error");
    appVcReceivedStub.rejects(error);

    await middleware.pollVcReceiptStatus(req as Request, res as Response, next);

    expect(res.status).to.have.been.calledWith(500);
    expect(res.json).to.have.been.calledWith({ status: "ERROR" });
  });

  it("getAppVcReceiptStatusAndStoreJourneyResponse should return session response if session journey is not PROCESSING", async () => {
    if (req.session) req.session.journey = "COMPLETED";
    const status =
      await middleware.getAppVcReceiptStatusAndStoreJourneyResponse(
        req as Request,
      );

    expect(appVcReceivedStub).to.not.have.been.called;

    expect(status).to.equal("COMPLETED");
  });

  it("getAppVcReceiptStatusAndStoreJourneyResponse should call API if session journey is PROCESSING", async () => {
    if (req.session) req.session.journey = "PROCESSING";
    appVcReceivedStub.resolves({ data: { journey: "journey/next" } });
    isJourneyResponse.returns(true);

    const status =
      await middleware.getAppVcReceiptStatusAndStoreJourneyResponse(
        req as Request,
      );

    expect(appVcReceivedStub).to.have.been.calledOnce;
    expect(status).to.equal("COMPLETED");
  });

  it("getAppVcReceiptStatusAndStoreJourneyResponse should call API if session journey is not present", async () => {
    if (req.session) req.session.journey = undefined;
    appVcReceivedStub.resolves({ data: { journey: "journey/next" } });
    isJourneyResponse.returns(true);

    const status =
      await middleware.getAppVcReceiptStatusAndStoreJourneyResponse(
        req as Request,
      );

    expect(appVcReceivedStub).to.have.been.calledOnce;
    expect(status).to.equal("COMPLETED");
  });
});
