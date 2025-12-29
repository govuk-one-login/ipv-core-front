import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";
import { Request, Response } from "express";
import * as coreBackService from "../../services/coreBackService";
import * as postJourneyEventResponse from "../validators/postJourneyEventResponse";
import config from "../../config/config";

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
      query: {
        preview: "",
      },
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

  it("pollVcReceiptStatus should return CLIENT_ERROR status if appVcReceived returns 400", async () => {
    const error = { response: { status: 400 } };
    appVcReceivedStub.rejects(error);

    await middleware.pollVcReceiptStatus(req as Request, res as Response, next);

    expect(res.status).to.have.been.calledWith(400);
    expect(res.json).to.have.been.calledWith({ status: "CLIENT_ERROR" });
  });

  it("pollVcReceiptStatus should return an error when appVcReceived does not return journey response", async () => {
    appVcReceivedStub.resolves({ data: {} });
    isJourneyResponse.returns(false);

    await middleware.pollVcReceiptStatus(req as Request, res as Response, next);

    expect(res.status).to.have.been.calledWith(500);
    expect(res.json).to.have.been.calledWith({ status: "SERVER_ERROR" });
  });

  it("pollVcReceiptStatus should return SERVER_ERROR status if appVcReceived throws non 400-499 error", async () => {
    const error = new Error("Test error");
    appVcReceivedStub.rejects(error);

    await middleware.pollVcReceiptStatus(req as Request, res as Response, next);

    expect(res.status).to.have.been.calledWith(500);
    expect(res.json).to.have.been.calledWith({ status: "SERVER_ERROR" });
  });

  it("pollVcReceiptStatus should return COMPLETED status when query param snapshotTest is true", async () => {
    req = {
      query: {
        snapshotTest: "true",
      },
    };
    config.ENABLE_PREVIEW = true;
    process.env.NODE_ENV = "local";

    await middleware.pollVcReceiptStatus(req as Request, res as Response, next);

    expect(res.status).to.have.been.calledWith(200);
    expect(res.json).to.have.been.calledWith({ status: "COMPLETED" });
  });

  it("pollVcReceiptStatus should return PROCESSING status when ENABLE_PREVIEW is true and preview query param is true", async () => {
    req = {
      query: {
        preview: "true",
      },
    };
    config.ENABLE_PREVIEW = true;

    await middleware.pollVcReceiptStatus(req as Request, res as Response, next);

    expect(res.status).to.have.been.calledWith(200);
    expect(res.json).to.have.been.calledWith({ status: "PROCESSING" });
  });
});
