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
    getParameter: sinon.fake(),
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

  it("should display English banner text if language is set to English", async () => {
    // Arrange
    const req = createRequest();
    req.i18n.language = "en";
    const res = createResponse();
    parameterServiceStub.getParameter = sinon.fake.resolves(
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
    expect(res.locals.bannerMessage).to.equal("Test banner");
    expect(next).to.have.been.calledOnce;
  });

  it("should display Welsh banner text if language is set to Welsh", async () => {
    // Arrange
    const req = createRequest();
    req.i18n.language = "cy";
    const res = createResponse();
    parameterServiceStub.getParameter = sinon.fake.resolves(
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
    expect(res.locals.bannerMessage).to.equal("Welsh Test banner");
    expect(next).to.have.been.calledOnce;
  });

  it("should display banner text from the second config variable if present", async () => {
    // Arrange
    const req = createRequest();
    req.i18n.language = "en";
    const res = createResponse();
    parameterServiceStub.getParameter = sinon.fake((paramName: string) => {
      if (paramName === "/core-front/notification-banner") {
        return JSON.stringify([
          {
            pageId: "/some-other-page",
            bannerMessage: "Test banner",
            bannerMessageCy: "Welsh Test banner",
            startTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            endTime: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
          },
        ]);
      }
      if (paramName === "/core-front/notification-banner2") {
        return JSON.stringify([
          {
            pageId: "/some-page",
            bannerMessage: "Test banner 2",
            bannerMessageCy: "Welsh Test banner 2",
            startTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            endTime: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
          },
        ]);
      }
    });

    // Act
    await notificationBannerHandler(req, res, next);

    // Assert
    expect(res.locals.displayBanner).to.be.true;
    expect(res.locals.bannerMessage).to.equal("Test banner 2");
    expect(next).to.have.been.calledOnce;
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

  it("should use parsed local environment variable 2 when NODE_ENV is local", async () => {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    process.env.NODE_ENV = "local";
    process.env["NOTIFICATION_BANNER"] = JSON.stringify([
      {
        pageId: "/some-other-page",
        bannerMessage: "Test banner",
        bannerMessageCy: "Welsh Test banner",
        startTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
      },
    ]);
    process.env["NOTIFICATION_BANNER_2"] = JSON.stringify([
      {
        pageId: "/some-page",
        bannerMessage: "Test banner 2",
        bannerMessageCy: "Welsh Test banner 2",
        startTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
      },
    ]);

    // Act
    await notificationBannerHandler(req, res, next);

    // Assert
    expect(res.locals.displayBanner).to.be.true;
    expect(res.locals.bannerMessage).to.equal("Test banner 2");
    expect(next).to.have.been.calledOnce;
  });

  it("should not display banner if no data is returned", async () => {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    parameterServiceStub.getParameter = sinon.fake.resolves("");

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
    parameterServiceStub.getParameter = sinon.fake.resolves(
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
    parameterServiceStub.getParameter = sinon.fake.resolves(
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
    parameterServiceStub.getParameter = sinon.fake.resolves(
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

  it("should not display banner if config has context but the request does not", async () => {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    parameterServiceStub.getParameter = sinon.fake.resolves(
      JSON.stringify([
        {
          pageId: "/some-page",
          bannerMessage: "Test banner",
          bannerMessageCy: "Welsh Test banner",
          context: "notMatchingContext",
          startTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
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

  it("should not display banner if config has no context but the request does", async () => {
    // Arrange
    const req = createRequest();
    req.session.context = "notMatchingContext";
    const res = createResponse();
    parameterServiceStub.getParameter = sinon.fake.resolves(
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
    expect(res.locals.displayBanner).to.be.false;
    expect(next).to.have.been.calledOnce;
  });

  it("should display banner if config and request have the same context", async () => {
    // Arrange
    const req = createRequest();
    req.session.context = "matchingContext";
    const res = createResponse();
    parameterServiceStub.getParameter = sinon.fake.resolves(
      JSON.stringify([
        {
          pageId: "/some-page",
          bannerMessage: "Test banner",
          bannerMessageCy: "Welsh Test banner",
          context: "matchingContext",
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

  it("should display correct banner if multiple banners configured for different contexts", async () => {
    // Arrange
    const req = createRequest();
    req.session.context = "matchingContext";
    const res = createResponse();
    parameterServiceStub.getParameter = sinon.fake.resolves(
      JSON.stringify([
        {
          pageId: "/some-page",
          bannerMessage: "Test banner",
          bannerMessageCy: "Welsh Test banner",
          context: "matchingContext",
          startTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          endTime: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
        },
        {
          pageId: "/some-page",
          bannerMessage: "Bad banner",
          bannerMessageCy: "Welsh Test banner",
          context: "notMatchingContext",
          startTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          endTime: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
        },
      ]),
    );

    // Act
    await notificationBannerHandler(req, res, next);

    // Assert
    expect(res.locals.displayBanner).to.be.true;
    expect(res.locals.bannerMessage).to.equal("Test banner");
    expect(next).to.have.been.calledOnce;
  });

  it("should continue if the config is invalid", async () => {
    // Arrange
    const req = createRequest();
    req.session.context = "matchingContext";
    const res = createResponse();
    parameterServiceStub.getParameter = sinon.fake.resolves("not JSON");

    // Act
    await notificationBannerHandler(req, res, next);

    // Assert
    expect(res.locals.displayBanner).to.be.false;
    expect(next).to.have.been.calledOnce;
  });
});
