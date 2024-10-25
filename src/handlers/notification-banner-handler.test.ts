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
      path: "/some-page",
    } as any;

    res = {
      locals: {},
    } as any;
    process.env.NODE_ENV = "production";
    next = sinon.fake() as any;
    getParameterStub = sinon.stub(parameterService, "getParameter");
  });

  afterEach(() => {
    sinon.restore();
    getParameterStub.restore();
  });

  it("should use parsed local environment variable when NODE_ENV is local", async () => {
    process.env.NODE_ENV = "local";
    process.env["NOTIFICATION_BANNER"] = JSON.stringify({
      pageId: "/some-page",
      bannerMessage: "Test banner",
      bannerMessageCy: "Welsh Test banner",
      startTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    });

    await notificationBannerHandler(req, res, next);

    expect(res.locals.displayBanner).to.be.true;
    expect(next).to.have.been.calledOnce;
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
      startTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
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
      startTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      endTime: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    });
    await notificationBannerHandler(req, res, next);

    expect(res.locals.displayBanner).to.be.false;
    expect(next).to.have.been.calledOnce;
  });

  it("should display banner if current time is between start and end time", async () => {
    getParameterStub.resolves({
      pageId: "/some-page",
      bannerMessage: "Test banner",
      bannerMessageCy: "Welsh Test banner",
      startTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    });

    await notificationBannerHandler(req, res, next);

    expect(res.locals.displayBanner).to.be.true;
    expect(next).to.have.been.calledOnce;
  });
});
