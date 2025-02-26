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

describe("getAppVcReceiptStatus", () => {
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

  it("should return PROCESSING status if appVcReceived returns 404", async () => {
    const error = { response: { status: 404 } };
    appVcReceivedStub.rejects(error);

    await middleware.getAppVcReceiptStatus(
      req as Request,
      res as Response,
      next,
    );

    expect(res.status).to.have.been.calledWith(200);
    expect(res.json).to.have.been.calledWith({ status: "PROCESSING" });
  });

  it("should return COMPLETED status on successful appVcReceived", async () => {
    appVcReceivedStub.resolves({ data: { journey: "journey/next" } });
    isJourneyResponse.returns(true);

    await middleware.getAppVcReceiptStatus(
      req as Request,
      res as Response,
      next,
    );

    expect(res.status).to.have.been.calledWith(200);
    expect(res.json).to.have.been.calledWith({ status: "COMPLETED" });
    expect((req.session as any).journey).to.equal("journey/next");
  });

  it("should return an error when appVcReceived does not return journey response", async () => {
    appVcReceivedStub.resolves({ data: {} });
    isJourneyResponse.returns(false);

    await middleware.getAppVcReceiptStatus(
      req as Request,
      res as Response,
      next,
    );

    expect(res.status).to.have.been.calledWith(500);
    expect(res.json).to.have.been.calledWith({ status: "ERROR" });
  });

  it("should return ERROR status if appVcReceived throws non 404 error", async () => {
    const error = new Error("Test error");
    appVcReceivedStub.rejects(error);

    await middleware.getAppVcReceiptStatus(
      req as Request,
      res as Response,
      next,
    );

    expect(res.status).to.have.been.calledWith(500);
    expect(res.json).to.have.been.calledWith({ status: "ERROR" });
  });
});
