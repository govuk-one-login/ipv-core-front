import { expect } from "chai";
import sinon from "sinon";
import { Request, Response } from "express";
import { getAppVcReceiptStatus } from "./middleware";
import * as coreBackService from "../../services/coreBackService";

describe("getAppVcReceiptStatus", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: any;
  let appVcReceivedStub: sinon.SinonStub;

  beforeEach(() => {
    req = {};
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };
    next = sinon.stub();
    appVcReceivedStub = sinon.stub(coreBackService, "appVcReceived");
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should return PROCESSING status if appVcReceived returns false", async () => {
    appVcReceivedStub.resolves(false);

    await getAppVcReceiptStatus(req as Request, res as Response, next);

    expect(res.status).to.have.been.calledWith(200);
    expect(res.json).to.have.been.calledWith({ status: "PROCESSING" });
    expect(next).to.not.have.been.called;
  });

  it("should return COMPLETED status if appVcReceived returns true", async () => {
    appVcReceivedStub.resolves(true);

    await getAppVcReceiptStatus(req as Request, res as Response, next);

    expect(res.status).to.have.been.calledWith(200);
    expect(res.json).to.have.been.calledWith({ status: "COMPLETED" });
    expect(next).to.not.have.been.called;
  });

  it("should return ERROR status if appVcReceived throws an error", async () => {
    const error = new Error("Test error");
    appVcReceivedStub.rejects(error);

    await getAppVcReceiptStatus(req as Request, res as Response, next);

    expect(res.status).to.have.been.calledWith(500);
    expect(res.json).to.have.been.calledWith({ status: "ERROR" });
    expect(next).to.have.been.calledWith(error);
  });
});
