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

  [
    { index: 1, paramName: "/core-front/notification-banner" },
    { index: 2, paramName: "/core-front/notification-banner2" },
    { index: 3, paramName: "/core-front/notification-banner3" },
    { index: 4, paramName: "/core-front/notification-banner4" },
  ].forEach(({ index, paramName }: { index: number; paramName: string }) => {
    it(`should display banner text from SSM config variable ${index} if present`, async () => {
      // Arrange
      const req = createRequest();
      req.i18n.language = "en";
      const res = createResponse();
      parameterServiceStub.getParameter = sinon.fake(
        (requestedParam: string) => {
          if (requestedParam === paramName) {
            return JSON.stringify([
              {
                pages: [{ pageId: "/some-page" }],
                bannerMessage: `Test banner ${index}`,
                bannerMessageCy: `Welsh Test banner ${index}`,
                startTime: beforeNow,
                endTime: afterNow,
              },
            ]);
          }
          // Other indices target a page that does not match the request
          return JSON.stringify([
            {
              pages: [{ pageId: "/some-other-page" }],
              bannerMessage: "Other banner",
              bannerMessageCy: "Welsh Other banner",
              startTime: beforeNow,
              endTime: afterNow,
            },
          ]);
        },
      );

      // Act
      await underTest(req, res, next);

      // Assert
      expect(res.locals.displayBanner).to.be.true;
      expect(res.locals.bannerMessage).to.equal(`Test banner ${index}`);
      expect(next).to.have.been.calledOnce;
    });
  });

  it("should process remaining configs when there is a gap (1 and 4 filled, 2 and 3 empty)", async () => {
    // Arrange
    const req = createRequest();
    req.i18n.language = "en";
    const res = createResponse();
    parameterServiceStub.getParameter = sinon.fake((paramName: string) => {
      if (paramName === "/core-front/notification-banner") {
        // Index 1 is filled but targets a page that does not match the request
        return JSON.stringify([
          {
            pages: [{ pageId: "/some-other-page" }],
            bannerMessage: "Test banner 1",
            bannerMessageCy: "Welsh Test banner 1",
            startTime: beforeNow,
            endTime: afterNow,
          },
        ]);
      }
      if (paramName === "/core-front/notification-banner4") {
        // Index 4 is filled and matches the request page
        return JSON.stringify([
          {
            pages: [{ pageId: "/some-page" }],
            bannerMessage: "Test banner 4",
            bannerMessageCy: "Welsh Test banner 4",
            startTime: beforeNow,
            endTime: afterNow,
          },
        ]);
      }
      // Indices 2 and 3 are empty - the loop should skip them and continue
      return "";
    });

    // Act
    await underTest(req, res, next);

    // Assert
    // The loop uses `continue` on empty slots rather than `break`, so index 4
    // is still read and processed after the gap at indices 2 and 3. If it
    // stopped at the gap, index 4's banner would never display.
    expect(parameterServiceStub.getParameter).to.have.callCount(4);
    expect(res.locals.displayBanner).to.be.true;
    expect(res.locals.bannerMessage).to.equal("Test banner 4");
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

  [
    { index: 1, envVar: "NOTIFICATION_BANNER" },
    { index: 2, envVar: "NOTIFICATION_BANNER_2" },
    { index: 3, envVar: "NOTIFICATION_BANNER_3" },
    { index: 4, envVar: "NOTIFICATION_BANNER_4" },
  ].forEach(({ index, envVar }: { index: number; envVar: string }) => {
    it(`should use parsed local environment variable ${index} when NODE_ENV is local`, async () => {
      // Arrange
      const req = createRequest();
      req.i18n.language = "en";
      const res = createResponse();
      process.env.NODE_ENV = "local";

      const allEnvVars = [
        "NOTIFICATION_BANNER",
        "NOTIFICATION_BANNER_2",
        "NOTIFICATION_BANNER_3",
        "NOTIFICATION_BANNER_4",
      ];

      // Only the target index matches the request page; the others target a
      // different page so they are present but do not trigger the banner.
      allEnvVars.forEach((name) => {
        process.env[name] = JSON.stringify([
          {
            pages: [
              { pageId: name === envVar ? "/some-page" : "/some-other-page" },
            ],
            bannerMessage: name === envVar ? `Test banner ${index}` : "Other",
            bannerMessageCy:
              name === envVar ? `Welsh Test banner ${index}` : "Welsh Other",
            startTime: beforeNow,
            endTime: afterNow,
          },
        ]);
      });

      try {
        // Act
        await underTest(req, res, next);

        // Assert
        expect(res.locals.displayBanner).to.be.true;
        expect(res.locals.bannerMessage).to.equal(`Test banner ${index}`);
        expect(next).to.have.been.calledOnce;
      } finally {
        allEnvVars.forEach((name) => delete process.env[name]);
      }
    });
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

  [
    {
      scenario:
        "config has context but the request does not - session pageContext is undefined",
      sessionPageContext: undefined,
      bannerConfigPageContexts: [{ notMatchingContext: true }],
    },
    {
      scenario:
        "config has context but the request does not - session pageContext is an empty object",
      sessionPageContext: {},
      bannerConfigPageContexts: [{ notMatchingContext: true }],
    },
    {
      scenario:
        "config has no context but the request does - banner config contexts is an empty array",
      sessionPageContext: { notMatchingContext: true },
      bannerConfigPageContexts: [],
    },
    {
      scenario:
        "config has no context but the request does - banner config contexts is undefined",
      sessionPageContext: { notMatchingContext: true },
      bannerConfigPageContexts: undefined,
    },
    {
      scenario:
        "config context is not an exact object match to the context in the request - value doesn't match",
      sessionPageContext: { notMatchingContext: true },
      bannerConfigPageContexts: [{ notMatchingContext: false }],
    },
    {
      scenario:
        "config context is not an exact object match to the context in the request - value matches but there's an unmatched property",
      sessionPageContext: { notMatchingContext: true },
      bannerConfigPageContexts: [
        { notMatchingContext: true, journeyType: "coi" },
      ],
    },
  ].forEach(
    ({
      scenario,
      sessionPageContext,
      bannerConfigPageContexts,
    }: {
      scenario: string;
      sessionPageContext?: Record<string, unknown>;
      bannerConfigPageContexts?: Record<string, unknown>[];
    }) => {
      it(`should not display banner if ${scenario}`, async () => {
        // Arrange
        const req = createRequest();
        req.session.pageContext = sessionPageContext;
        const res = createResponse();
        parameterServiceStub.getParameter = sinon.fake.resolves(
          JSON.stringify([
            {
              pages: [
                { pageId: "/some-page", contexts: bannerConfigPageContexts },
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
        expect(res.locals.displayBanner).to.be.false;
        expect(next).to.have.been.calledOnce;
      });
    },
  );

  [
    {
      scenario: "config and request have the exact same context",
      sessionPageContext: {
        matchingContextBoolean: true,
        matchingContextString: "matched",
      },
      bannerConfigPageContexts: [
        { matchingContextBoolean: true, matchingContextString: "matched" },
      ],
    },
    {
      scenario:
        "config and request have a matching context and banner config contexts is multi-valued",
      sessionPageContext: { matchingContext: true },
      bannerConfigPageContexts: [
        { matchingContext: true },
        { nonMatchingContext: "test" },
      ],
    },
    {
      scenario:
        "request has no context and config has no context - banner config context is undefined",
      sessionPageContext: undefined,
      bannerConfigPageContexts: undefined,
    },
    {
      scenario:
        "request has no context and config has no context - banner config context contains empty object",
      sessionPageContext: undefined,
      bannerConfigPageContexts: [{}],
    },
    {
      scenario: "request has no context and config has matching empty variant",
      sessionPageContext: undefined,
      bannerConfigPageContexts: [
        { noMatchingContext: true },
        { nonMatchingContext: "test" },
        {},
      ],
    },
  ].forEach(
    ({
      scenario,
      sessionPageContext,
      bannerConfigPageContexts,
    }: {
      scenario: string;
      sessionPageContext?: Record<string, unknown>;
      bannerConfigPageContexts?: Record<string, unknown>[];
    }) => {
      it(`should display banner if ${scenario}`, async () => {
        // Arrange
        const req = createRequest();
        req.session.pageContext = sessionPageContext;
        const res = createResponse();
        parameterServiceStub.getParameter = sinon.fake.resolves(
          JSON.stringify([
            {
              pages: [
                { pageId: "/some-page", contexts: bannerConfigPageContexts },
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
    },
  );

  it("should display correct banner if multiple banners configured for different contexts", async () => {
    // Arrange
    const req = createRequest();
    req.session.pageContext = { matchingContext: true };
    const res = createResponse();
    parameterServiceStub.getParameter = sinon.fake.resolves(
      JSON.stringify([
        {
          pages: [
            { pageId: "/some-page", contexts: [{ matchingContext: true }] },
          ],
          bannerMessage: "Test banner",
          bannerMessageCy: "Welsh Test banner",
          startTime: beforeNow,
          endTime: afterNow,
        },
        {
          pages: [
            { pageId: "/some-page", contexts: [{ matchingContext: false }] },
          ],
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
