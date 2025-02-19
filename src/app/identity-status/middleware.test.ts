import { expect } from "chai";
import sinon from "sinon";
import { Request, Response } from "express";
import { proveIdentityStatusCallbackGet } from "./middleware";
import * as coreBackService from "../../services/coreBackService";

describe("proveIdentityStatusCallbackGet", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: any;
  let getDcMawPollStub: sinon.SinonStub;

  beforeEach(() => {
    req = {};
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };
    next = sinon.stub();
    getDcMawPollStub = sinon.stub(coreBackService, "getDcMawPoll");
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should return PROCESSING status if getDcMawPoll returns false", async () => {
    getDcMawPollStub.resolves(false);

    await proveIdentityStatusCallbackGet(req as Request, res as Response, next);

    expect(res.status).to.have.been.calledWith(200);
    expect(res.json).to.have.been.calledWith({ status: "PROCESSING" });
    expect(next).to.not.have.been.called;
  });

  it("should return COMPLETED status if getDcMawPoll returns true", async () => {
    getDcMawPollStub.resolves(true);

    await proveIdentityStatusCallbackGet(req as Request, res as Response, next);

    expect(res.status).to.have.been.calledWith(200);
    expect(res.json).to.have.been.calledWith({ status: "COMPLETED" });
    expect(next).to.not.have.been.called;
  });

  it("should return ERROR status if getDcMawPoll throws an error", async () => {
    const error = new Error("Test error");
    getDcMawPollStub.rejects(error);

    await proveIdentityStatusCallbackGet(req as Request, res as Response, next);

    expect(res.status).to.have.been.calledWith(500);
    expect(res.json).to.have.been.calledWith({ status: "ERROR" });
    expect(next).to.have.been.calledWith(error);
  });
});
