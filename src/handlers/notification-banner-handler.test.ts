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
    getParametersByPath: sinon.fake(),
  };

  const loggerStub = {
    logger: {
      info: sinon.spy(),
      error: sinon.spy(),
      debug: sinon.spy(),
      warn: sinon.spy(),
    },
  };

  const BANNERS_PATH = "/core-front/notification-banners";

  // Stubs getParametersByPath to return the given banner config arrays as a
  // map keyed by slot path (mirroring how SSM stores them). Pass one array
  // per slot; most tests use a single slot.
  const stubBannerSlots = (...slots: unknown[][]): void => {
    const map: Record<string, string> = {};
    slots.forEach((slot, i) => {
      map[`${BANNERS_PATH}/${i + 1}`] = JSON.stringify(slot);
    });
    parameterServiceStub.getParametersByPath = sinon.fake.resolves(map);
  };

  // Stubs getParametersByPath to return a raw name->value map directly, for
  // tests that need malformed values or custom slot keys.
  const stubBannerMap = (map: Record<string, string>): void => {
    parameterServiceStub.getParametersByPath = sinon.fake.resolves(map);
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

    parameterServiceStub.getParametersByPath.resetHistory();

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
    stubBannerSlots([
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
    expect(res.locals.bannerMessage).to.equal("Test banner");
    expect(next).to.have.been.calledOnce;
  });

  it("should display Welsh banner text if language is set to Welsh", async () => {
    // Arrange
    const req = createRequest();
    req.i18n.language = "cy";
    const res = createResponse();
    stubBannerSlots([
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
    expect(res.locals.bannerMessage).to.equal("Welsh Test banner");
    expect(next).to.have.been.calledOnce;
  });

  [1, 2, 3, 4].forEach((slot: number) => {
    it(`should display banner text from SSM banner slot ${slot} if present`, async () => {
      // Arrange
      const req = createRequest();
      req.i18n.language = "en";
      const res = createResponse();

      // Build four slots; only the target slot matches the request page.
      const slots = [1, 2, 3, 4].map((s) => [
        {
          pages: [{ pageId: s === slot ? "/some-page" : "/some-other-page" }],
          bannerMessage: s === slot ? `Test banner ${slot}` : "Other banner",
          bannerMessageCy:
            s === slot ? `Welsh Test banner ${slot}` : "Welsh Other banner",
          startTime: beforeNow,
          endTime: afterNow,
        },
      ]);
      stubBannerSlots(...slots);

      // Act
      await underTest(req, res, next);

      // Assert
      expect(res.locals.displayBanner).to.be.true;
      expect(res.locals.bannerMessage).to.equal(`Test banner ${slot}`);
      expect(next).to.have.been.calledOnce;
    });
  });

  it("should process all slots when there is a gap (1 and 4 filled, 2 and 3 absent)", async () => {
    // Arrange
    const req = createRequest();
    req.i18n.language = "en";
    const res = createResponse();

    // GetParametersByPath only returns slots that exist, so a gap simply means
    // the map has keys 1 and 4. Slot 4 matches the request page.
    stubBannerMap({
      [`${BANNERS_PATH}/1`]: JSON.stringify([
        {
          pages: [{ pageId: "/some-other-page" }],
          bannerMessage: "Test banner 1",
          bannerMessageCy: "Welsh Test banner 1",
          startTime: beforeNow,
          endTime: afterNow,
        },
      ]),
      [`${BANNERS_PATH}/4`]: JSON.stringify([
        {
          pages: [{ pageId: "/some-page" }],
          bannerMessage: "Test banner 4",
          bannerMessageCy: "Welsh Test banner 4",
          startTime: beforeNow,
          endTime: afterNow,
        },
      ]),
    });

    // Act
    await underTest(req, res, next);

    // Assert
    expect(res.locals.displayBanner).to.be.true;
    expect(res.locals.bannerMessage).to.equal("Test banner 4");
    expect(next).to.have.been.calledOnce;
  });

  it("should isolate a malformed slot and still display banners from other slots", async () => {
    // Arrange
    const req = createRequest();
    req.i18n.language = "en";
    const res = createResponse();

    // Slot 2 holds invalid JSON; slot 4 holds a matching banner. The handler
    // parses each slot in its own try/catch, so a malformed slot must not
    // discard the whole map or hide slot 4's banner.
    stubBannerMap({
      [`${BANNERS_PATH}/2`]: "not JSON",
      [`${BANNERS_PATH}/4`]: JSON.stringify([
        {
          pages: [{ pageId: "/some-page" }],
          bannerMessage: "Test banner 4",
          bannerMessageCy: "Welsh Test banner 4",
          startTime: beforeNow,
          endTime: afterNow,
        },
      ]),
    });

    // Act
    await underTest(req, res, next);

    // Assert
    // Slot 4's banner still displays despite slot 2 being malformed, proving
    // per-slot parse isolation. (Error-logging of the malformed slot is
    // asserted separately in the non-displaying "invalid JSON" test, since a
    // displaying banner also invokes i18next which is not initialised here.)
    expect(res.locals.displayBanner).to.be.true;
    expect(res.locals.bannerMessage).to.equal("Test banner 4");
    expect(next).to.have.been.calledOnce;
  });

  it("should display banner text on all pages", async () => {
    // Arrange
    const req = createRequest();
    req.i18n.language = "en";
    const res = createResponse();
    stubBannerSlots([
      {
        pages: [{ pageId: "/some-other-page" }, { pageId: "/some-page" }],
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
    expect(res.locals.bannerMessage).to.equal("Test banner");
    expect(next).to.have.been.calledOnce;
  });

  it("should use the NOTIFICATION_BANNERS env var map when NODE_ENV is local", async () => {
    // Arrange
    const req = createRequest();
    req.i18n.language = "en";
    const res = createResponse();
    process.env.NODE_ENV = "local";

    // Local running holds the whole map in one env var as structured JSON.
    // Slot "2" matches the request page; the others do not.
    process.env.NOTIFICATION_BANNERS = JSON.stringify({
      "1": [
        {
          pages: [{ pageId: "/some-other-page" }],
          bannerMessage: "Other",
          bannerMessageCy: "Welsh Other",
          startTime: beforeNow,
          endTime: afterNow,
        },
      ],
      "2": [
        {
          pages: [{ pageId: "/some-page" }],
          bannerMessage: "Test banner 2",
          bannerMessageCy: "Welsh Test banner 2",
          startTime: beforeNow,
          endTime: afterNow,
        },
      ],
    });

    try {
      // Act
      await underTest(req, res, next);

      // Assert
      expect(res.locals.displayBanner).to.be.true;
      expect(res.locals.bannerMessage).to.equal("Test banner 2");
      // The SSM path must not be used in local mode.
      expect(parameterServiceStub.getParametersByPath).to.not.have.been.called;
      expect(next).to.have.been.calledOnce;
    } finally {
      delete process.env.NOTIFICATION_BANNERS;
    }
  });

  it("should exit early in local mode when the NOTIFICATION_BANNERS env var is absent", async () => {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    process.env.NODE_ENV = "local";
    delete process.env.NOTIFICATION_BANNERS;

    // Act
    await underTest(req, res, next);

    // Assert
    expect(res.locals.displayBanner).to.be.false;
    expect(parameterServiceStub.getParametersByPath).to.not.have.been.called;
    expect(next).to.have.been.calledOnce;
  });

  it("should log and continue in local mode when NOTIFICATION_BANNERS is invalid JSON", async () => {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    process.env.NODE_ENV = "local";
    process.env.NOTIFICATION_BANNERS = "not JSON";

    try {
      // Act
      await underTest(req, res, next);

      // Assert
      // An unparseable env blob is logged and treated as no banners rather
      // than throwing out of the handler.
      expect(res.locals.displayBanner).to.be.false;
      expect(loggerStub.logger.error).to.have.been.calledOnce;
      expect(next).to.have.been.calledOnce;
    } finally {
      delete process.env.NOTIFICATION_BANNERS;
    }
  });

  it("should make a single getParametersByPath call for the banners path", async () => {
    // Arrange
    const req = createRequest();
    req.i18n.language = "en";
    const res = createResponse();
    stubBannerSlots([
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
    expect(
      parameterServiceStub.getParametersByPath,
    ).to.have.been.calledOnceWith(BANNERS_PATH);
    expect(next).to.have.been.calledOnce;
  });

  it("should exit early when no banner slots exist (empty map)", async () => {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    stubBannerMap({});

    // Act
    await underTest(req, res, next);

    // Assert
    expect(res.locals.displayBanner).to.be.false;
    expect(next).to.have.been.calledOnce;
  });

  it("should not display banner if a slot holds an empty array", async () => {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    stubBannerSlots([]);

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
    stubBannerSlots([
      {
        pages: [{ pageId: "/some-page" }],
        bannerMessage: "Test banner",
        bannerMessageCy: "Welsh Test banner",
        startTime: afterNow,
        endTime: afterNow,
      },
    ]);

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
    stubBannerSlots([
      {
        pages: [{ pageId: "/some-page" }],
        bannerMessage: "Test banner",
        bannerMessageCy: "Welsh Test banner",
        startTime: beforeNow,
        endTime: beforeNow,
      },
    ]);

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
    stubBannerSlots([
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

  it("should display banner if current time is between start and end times in different timezones", async () => {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    stubBannerSlots([
      {
        pages: [{ pageId: "/some-page" }],
        bannerMessage: "Test banner",
        bannerMessageCy: "Welsh Test banner",
        startTime: beforeNowBst,
        endTime: afterNowCapeVerde,
      },
    ]);

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
        stubBannerSlots([
          {
            pages: [
              { pageId: "/some-page", contexts: bannerConfigPageContexts },
            ],
            bannerMessage: "Test banner",
            bannerMessageCy: "Welsh Test banner",
            startTime: beforeNow,
            endTime: afterNow,
          },
        ]);

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
        stubBannerSlots([
          {
            pages: [
              { pageId: "/some-page", contexts: bannerConfigPageContexts },
            ],
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
    },
  );

  it("should display correct banner if multiple banners configured for different contexts", async () => {
    // Arrange
    const req = createRequest();
    req.session.pageContext = { matchingContext: true };
    const res = createResponse();
    stubBannerSlots([
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
    ]);

    // Act
    await underTest(req, res, next);

    // Assert
    expect(res.locals.displayBanner).to.be.true;
    expect(res.locals.bannerMessage).to.equal("Test banner");
    expect(next).to.have.been.calledOnce;
  });

  it("should continue if a slot holds invalid JSON", async () => {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    stubBannerMap({ [`${BANNERS_PATH}/1`]: "not JSON" });

    // Act
    await underTest(req, res, next);

    // Assert
    expect(res.locals.displayBanner).to.be.false;
    expect(next).to.have.been.calledOnce;
    expect(loggerStub.logger.error).to.have.been.calledOnce;
  });

  it("should continue and not display a banner if getParametersByPath rejects", async () => {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    parameterServiceStub.getParametersByPath = sinon.fake.rejects(
      new Error("SSM unavailable"),
    );

    // Act
    await underTest(req, res, next);

    // Assert
    expect(res.locals.displayBanner).to.be.false;
    expect(next).to.have.been.calledOnce;
    expect(loggerStub.logger.error).to.have.been.calledOnce;
  });
});
