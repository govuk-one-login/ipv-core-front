import { expect } from "chai";
import sinon, { SinonFakeTimers } from "sinon";
import {
  specifyCreateRequest,
  specifyCreateResponse,
} from "../test-utils/mock-express";
import proxyquire from "proxyquire";
import { RequestHandler } from "express";

describe("Notification banner handler", () => {
  // Mock handler parameters
  const createRequest = specifyCreateRequest({
    path: "/some-page",
  });
  const createResponse = specifyCreateResponse();
  const next: any = sinon.fake();
  const now = new Date("2025-01-01T12:00:00.000+0000");
  const beforeNow = "2025-01-01T11:30:00.000+0000";
  const afterNow = "2025-01-01T12:30:00.000+0000";
  const beforeNowBst = "2025-01-01T12:30:00.000+0100";
  const afterNowCapeVerde = "2025-01-01T11:30:00.000-0100";

  // Setup stubs
  const parameterServiceStub = {
    getParameter: sinon.fake(),
  };

  const loggerStub = {
    logger: {
      info: sinon.spy(),
      error: sinon.spy(),
      debug: sinon.spy(),
      warn: sinon.spy(),
    },
  };

  let underTest: RequestHandler = proxyquire("./notification-banner-handler", {
    "../services/parameterStoreService": parameterServiceStub,
    "../lib/logger": loggerStub,
  }).default;

  let clock: SinonFakeTimers;

  before(() => {
    clock = sinon.useFakeTimers(now);
  });

  after(() => {
    clock.restore();
  });

  beforeEach(() => {
    process.env.NODE_ENV = "production";

    next.resetHistory();

    parameterServiceStub.getParameter.resetHistory();

    loggerStub.logger.info.resetHistory();
    loggerStub.logger.error.resetHistory();
    loggerStub.logger.debug.resetHistory();
    loggerStub.logger.warn.resetHistory();

    underTest = proxyquire("./notification-banner-handler", {
      "../services/parameterStoreService": parameterServiceStub,
      "../lib/logger": loggerStub,
    }).default;
  });

  it("should display English banner text if language is set to English", async () => {
    // Arrange
    const req = createRequest();
    req.i18n.language = "en";
    const res = createResponse();
    parameterServiceStub.getParameter = sinon.fake.resolves(
      JSON.stringify([
        {
          pages: [{ pageId: "/some-page" }],
          bannerMessage: "Test banner",
          bannerMessageCy: "Welsh Test banner",
          startTime: beforeNow,
          endTime: afterNow,
        },
      ]),
    );

    // Act
    await underTest(req, res, next);

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
          pages: [{ pageId: "/some-page" }],
          bannerMessage: "Test banner",
          bannerMessageCy: "Welsh Test banner",
          startTime: beforeNow,
          endTime: afterNow,
        },
      ]),
    );

    // Act
    await underTest(req, res, next);

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
            pages: [{ pageId: "/some-other-page" }],
            bannerMessage: "Test banner",
            bannerMessageCy: "Welsh Test banner",
            startTime: beforeNow,
            endTime: afterNow,
          },
        ]);
      }
      if (paramName === "/core-front/notification-banner2") {
        return JSON.stringify([
          {
            pages: [{ pageId: "/some-page" }],
            bannerMessage: "Test banner 2",
            bannerMessageCy: "Welsh Test banner 2",
            startTime: beforeNow,
            endTime: afterNow,
          },
        ]);
      }
    });

    // Act
    await underTest(req, res, next);

    // Assert
    expect(res.locals.displayBanner).to.be.true;
    expect(res.locals.bannerMessage).to.equal("Test banner 2");
    expect(next).to.have.been.calledOnce;
  });

  it("should display banner text on all pages", async () => {
    // Arrange
    const req = createRequest();
    req.i18n.language = "en";
    const res = createResponse();
    parameterServiceStub.getParameter = sinon.fake((paramName: string) => {
      if (paramName === "/core-front/notification-banner") {
        return JSON.stringify([
          {
            pages: [{ pageId: "/some-other-page" }, { pageId: "/some-page" }],
            bannerMessage: "Test banner",
            bannerMessageCy: "Welsh Test banner",
            startTime: beforeNow,
            endTime: afterNow,
          },
        ]);
      }
    });

    // Act
    await underTest(req, res, next);

    // Assert
    expect(res.locals.displayBanner).to.be.true;
    expect(res.locals.bannerMessage).to.equal("Test banner");
    expect(next).to.have.been.calledOnce;
  });

  it("should use parsed local environment variable when NODE_ENV is local", async () => {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    process.env.NODE_ENV = "local";
    process.env["NOTIFICATION_BANNER"] = JSON.stringify([
      {
        pages: [{ pageId: "/some-page" }],
        bannerMessage: "Test banner",
        bannerMessageCy: "Welsh Test banner",
        startTime: beforeNow,
        endTime: afterNow,
      },
    ]);

    // Act
    await underTest(req, res, next);

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
        pages: [{ pageId: "/some-other-page" }],
        bannerMessage: "Test banner",
        bannerMessageCy: "Welsh Test banner",
        startTime: beforeNow,
        endTime: afterNow,
      },
    ]);
    process.env["NOTIFICATION_BANNER_2"] = JSON.stringify([
      {
        pages: [{ pageId: "/some-page" }],
        bannerMessage: "Test banner 2",
        bannerMessageCy: "Welsh Test banner 2",
        startTime: beforeNow,
        endTime: afterNow,
      },
    ]);

    // Act
    await underTest(req, res, next);

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
    await underTest(req, res, next);

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
          pages: [{ pageId: "/some-page" }],
          bannerMessage: "Test banner",
          bannerMessageCy: "Welsh Test banner",
          startTime: afterNow,
          endTime: afterNow,
        },
      ]),
    );

    // Act
    await underTest(req, res, next);

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
          pages: [{ pageId: "/some-page" }],
          bannerMessage: "Test banner",
          bannerMessageCy: "Welsh Test banner",
          startTime: beforeNow,
          endTime: beforeNow,
        },
      ]),
    );

    // Act
    await underTest(req, res, next);

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
          pages: [{ pageId: "/some-page" }],
          bannerMessage: "Test banner",
          bannerMessageCy: "Welsh Test banner",
          startTime: beforeNow,
          endTime: afterNow,
        },
      ]),
    );

    // Act
    await underTest(req, res, next);

    // Assert
    expect(res.locals.displayBanner).to.be.true;
    expect(next).to.have.been.calledOnce;
  });

  it("should display banner if current time is between start and end times in different timezones", async () => {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    parameterServiceStub.getParameter = sinon.fake.resolves(
      JSON.stringify([
        {
          pages: [{ pageId: "/some-page" }],
          bannerMessage: "Test banner",
          bannerMessageCy: "Welsh Test banner",
          startTime: beforeNowBst,
          endTime: afterNowCapeVerde,
        },
      ]),
    );

    // Act
    await underTest(req, res, next);

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
          pages: [{ pageId: "/some-page", contexts: ["notMatchingContext"] }],
          bannerMessage: "Test banner",
          bannerMessageCy: "Welsh Test banner",
          startTime: beforeNow,
          endTime: afterNow,
        },
      ]),
    );

    // Act
    await underTest(req, res, next);

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
          pages: [{ pageId: "/some-page" }],
          bannerMessage: "Test banner",
          bannerMessageCy: "Welsh Test banner",
          startTime: beforeNow,
          endTime: afterNow,
        },
      ]),
    );

    // Act
    await underTest(req, res, next);

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
          pages: [{ pageId: "/some-page", contexts: ["matchingContext"] }],
          bannerMessage: "Test banner",
          bannerMessageCy: "Welsh Test banner",
          startTime: beforeNow,
          endTime: afterNow,
        },
      ]),
    );

    // Act
    await underTest(req, res, next);

    // Assert
    expect(res.locals.displayBanner).to.be.true;
    expect(next).to.have.been.calledOnce;
  });

  it("should display banner if config has blank and non-blank contexts and request has no context", async () => {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    parameterServiceStub.getParameter = sinon.fake.resolves(
      JSON.stringify([
        {
          pages: [
            { pageId: "/some-page", contexts: ["notMatchingContext", ""] },
          ],
          bannerMessage: "Test banner",
          bannerMessageCy: "Welsh Test banner",
          startTime: beforeNow,
          endTime: afterNow,
        },
      ]),
    );

    // Act
    await underTest(req, res, next);

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
          pages: [{ pageId: "/some-page", contexts: ["matchingContext"] }],
          bannerMessage: "Test banner",
          bannerMessageCy: "Welsh Test banner",
          startTime: beforeNow,
          endTime: afterNow,
        },
        {
          pages: [{ pageId: "/some-page", contexts: ["notMatchingContext"] }],
          bannerMessage: "Bad banner",
          bannerMessageCy: "Welsh Test banner",
          startTime: beforeNow,
          endTime: afterNow,
        },
      ]),
    );

    // Act
    await underTest(req, res, next);

    // Assert
    expect(res.locals.displayBanner).to.be.true;
    expect(res.locals.bannerMessage).to.equal("Test banner");
    expect(next).to.have.been.calledOnce;
  });

  it("should continue if the config is invalid", async () => {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    parameterServiceStub.getParameter = sinon.fake.resolves("not JSON");

    // Act
    await underTest(req, res, next);

    // Assert
    expect(res.locals.displayBanner).to.be.false;
    expect(next).to.have.been.calledOnce;
    expect(loggerStub.logger.error).to.have.been.calledOnce;
  });
});
