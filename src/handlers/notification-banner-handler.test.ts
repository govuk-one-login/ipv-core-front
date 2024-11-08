import { expect } from "chai";
import sinon from "sinon";
import {
  specifyCreateRequest,
  specifyCreateResponse,
} from "../test-utils/mock-express";
import proxyquire from "proxyquire";

describe("Notification banner handler", () => {
  // Mock handler parameters
  const createRequest = specifyCreateRequest({
    path: "/some-page",
  });
  const createResponse = specifyCreateResponse();
  const next: any = sinon.fake();

  // Setup stubs
  const parameterServiceStub = {
    getParameter: sinon.stub(),
  };
  const { default: notificationBannerHandler } = proxyquire(
    "./notification-banner-handler",
    {
      "../services/parameterStoreService": parameterServiceStub,
    },
  );

  beforeEach(() => {
    process.env.NODE_ENV = "production";
    next.resetHistory();
    parameterServiceStub.getParameter.resetHistory();
  });

  it("should use parsed local environment variable when NODE_ENV is local", async () => {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    process.env.NODE_ENV = "local";
    process.env["NOTIFICATION_BANNER"] = JSON.stringify([
      {
        pageId: "/some-page",
        bannerMessage: "Test banner",
        bannerMessageCy: "Welsh Test banner",
        startTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
      },
    ]);

    // Act
    await notificationBannerHandler(req, res, next);

    // Assert
    expect(res.locals.displayBanner).to.be.true;
    expect(next).to.have.been.calledOnce;
  });

  it("should not display banner if no data is returned", async () => {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    parameterServiceStub.getParameter.resolves(undefined);

    // Act
    await notificationBannerHandler(req, res, next);

    // Assert
    expect(res.locals.displayBanner).to.be.false;
    expect(next).to.have.been.calledOnce;
  });

  it("should not display banner if current time is before start time", async () => {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    parameterServiceStub.getParameter.resolves(
      JSON.stringify([
        {
          pageId: "/some-page",
          bannerMessage: "Test banner",
          bannerMessageCy: "Welsh Test banner",
          startTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
          endTime: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
        },
      ]),
    );

    // Act
    await notificationBannerHandler(req, res, next);

    // Assert
    expect(res.locals.displayBanner).to.be.false;
    expect(next).to.have.been.calledOnce;
  });

  it("should not display banner if current time is after end time", async () => {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    parameterServiceStub.getParameter.resolves(
      JSON.stringify([
        {
          pageId: "/some-page",
          bannerMessage: "Test banner",
          bannerMessageCy: "Welsh Test banner",
          startTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          endTime: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        },
      ]),
    );

    // Act
    await notificationBannerHandler(req, res, next);

    // Assert
    expect(res.locals.displayBanner).to.be.false;
    expect(next).to.have.been.calledOnce;
  });

  it("should display banner if current time is between start and end time", async () => {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    parameterServiceStub.getParameter.resolves(
      JSON.stringify([
        {
          pageId: "/some-page",
          bannerMessage: "Test banner",
          bannerMessageCy: "Welsh Test banner",
          startTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          endTime: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
        },
      ]),
    );

    // Act
    await notificationBannerHandler(req, res, next);

    // Assert
    expect(res.locals.displayBanner).to.be.true;
    expect(next).to.have.been.calledOnce;
  });
});
