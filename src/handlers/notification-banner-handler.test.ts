import notificationBannerHandler from "./notification-banner-handler";
import { NextFunction, Request, Response } from "express";
import { expect } from "chai";
import sinon from "sinon";
import * as parameterService from "../services/parameterStoreService";

describe("Notification banner handler", () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;
  let getParameterStub: sinon.SinonStub;

  beforeEach(() => {
    req = {
      session: {},
      originalUrl: "/some-page",
    } as any;

    res = {
      locals: {},
    } as any;

    next = sinon.fake() as any;
    getParameterStub = sinon.stub(parameterService, "getParameter");
  });

  afterEach(() => {
    sinon.restore();
    getParameterStub.restore();
  });

  it("should not display banner if no data is returned", async () => {
    getParameterStub.resolves(undefined);
    await notificationBannerHandler(req, res, next);

    expect(res.locals.displayBanner).to.be.false;
    expect(next).to.have.been.calledOnce;
  });

  it("should not display banner if current time is before start time", async () => {
    getParameterStub.resolves({
      pageId: "/some-page",
      bannerMessage: "Test banner",
      bannerMessageCy: "Welsh Test banner",
      startTime: Date.now() + 1000 * 60 * 60 * 24,
      endTime: Date.now() + 1000 * 60 * 60 * 48,
    });
    await notificationBannerHandler(req, res, next);

    expect(res.locals.displayBanner).to.be.false;
    expect(next).to.have.been.calledOnce;
  });

  it("should not display banner if current time is after end time", async () => {
    getParameterStub.resolves({
      pageId: "/some-page",
      bannerMessage: "Test banner",
      bannerMessageCy: "Welsh Test banner",
      startTime: Date.now() - 1000 * 60 * 60 * 24,
      endTime: Date.now() - 1000 * 60 * 60 * 12,
    });
    await notificationBannerHandler(req, res, next);

    expect(res.locals.displayBanner).to.be.false;
    expect(next).to.have.been.calledOnce;
  });

  it("should display banner if current time is between start and end time", async () => {
    getParameterStub.withArgs(1).resolves({
      pageId: "/some-page",
      bannerMessage: "Test banner",
      bannerMessageCy: "Welsh Test banner",
      startTime: Date.now() - 1000 * 60 * 60 * 24,
      endTime: Date.now() + 1000 * 60 * 60 * 24,
    });

    await notificationBannerHandler(req, res, next);

    expect(res.locals.displayBanner).to.be.true;
    expect(next).to.have.been.calledOnce;
  });
});
