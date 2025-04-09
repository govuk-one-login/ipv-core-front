import proxyquire from "proxyquire";
import { expect } from "chai";
import sinon from "sinon";
import TechnicalError from "../../errors/technical-error";
import BadRequestError from "../../errors/bad-request-error";
import {
  specifyCreateRequest,
  specifyCreateResponse,
} from "../../test-utils/mock-express";

describe("oauth middleware", () => {
  // Mock handler parameters
  const createRequest = specifyCreateRequest({
    body: { journey: "journey/next" },
    query: {
      response_type: "code",
      client_id: "s6BhdRkqt3",
      state: "xyz",
      redirect_uri: "https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb",
      unusedParam: "not used",
      request: "test request",
    },
    session: {
      ipvSessionId: "abadcafe",
    },
  });
  const createResponse = specifyCreateResponse();
  const next: any = sinon.fake();

  // Setup stubs
  const coreBackServiceStub = {
    postJourneyEvent: sinon.fake(),
    postSessionInitialise: sinon.fake(),
  };
  const configStub = {
    API_BASE_URL: "https://example.org/subpath",
  };
  const ipvMiddleware = proxyquire("../ipv/middleware", {
    "../../services/coreBackService": coreBackServiceStub,
    "../../config/config": { default: configStub },
  });
  const middleware = proxyquire("./middleware", {
    "../../services/coreBackService": coreBackServiceStub,
    "../../config/config": { default: configStub },
    "../ipv/middleware": ipvMiddleware,
  });

  beforeEach(() => {
    next.resetHistory();
    coreBackServiceStub.postJourneyEvent = sinon.fake.resolves({
      data: {
        ipvSessionId: {},
      },
    });
    coreBackServiceStub.postSessionInitialise.resetHistory();
  });

  it("should pass next journey event when handling OAuth Call", async () => {
    // Arrange
    const req = createRequest();
    const res = createResponse();

    // Act & Assert
    await expect(
      middleware.handleOAuthJourneyAction(req, res, next),
    ).to.be.rejectedWith(Error);
    expect(coreBackServiceStub.postJourneyEvent).to.have.been.called;
  });

  it("should pass next journey event by default when handling OAuth Call", async () => {
    // Arrange
    const req = createRequest({
      body: { journey: "journey/nonsense" },
    });
    const res = createResponse();

    // Act & Assert
    await expect(
      middleware.handleOAuthJourneyAction(req, res, next),
    ).to.be.rejectedWith(Error);
    expect(coreBackServiceStub.postJourneyEvent).to.have.been.called;
  });

  it("should throw TechnicalError with cause stack when processAction fails", async () => {
    // Arrange
    const cause = new Error("Some lower-level failure");
    const req = createRequest({
      session: { ipvSessionId: "valid-session-id" },
    });
    const res = createResponse();

    ipvMiddleware.processAction = async () => {
      throw new TechnicalError("Processing failed", cause);
    };

    // Act & Assert
    await expect(middleware.handleOAuthJourneyAction(req, res, next))
      .to.be.rejectedWith(TechnicalError, "Processing failed")
      .and.eventually.satisfy((err: any) => {
        expect(err.stack).to.include("Processing failed");
        expect(err.stack).to.include(
          "caused by: Error: Some lower-level failure",
        );
        expect(err.stack).to.include(cause.stack!);
        return true;
      });
  });

  it("should throw error when handling OAuth Call if missing ipvSessionId", async () => {
    // Arrange
    const req = createRequest({
      session: { ipvSessionId: undefined },
    });
    const res = createResponse();

    // Act & Assert
    await expect(
      middleware.handleOAuthJourneyAction(req, res, next),
    ).to.be.rejectedWith(TechnicalError, "missing ipvSessionId");
  });

  it("should set ipvSessionId in session", async () => {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    coreBackServiceStub.postSessionInitialise = sinon.fake.returns({
      data: { ipvSessionId: "test-ipv-session-id" },
    });

    // Act
    await middleware.setIpvSessionId(req, res, next);

    // Assert
    expect(req.session.ipvSessionId).to.eq("test-ipv-session-id");
    expect(next).to.have.been.called;
  });

  it("should set ipvSessionId as null in session if response contains null", async () => {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    coreBackServiceStub.postSessionInitialise = sinon.fake.returns({
      data: { ipvSessionId: null },
    });

    // Act
    await middleware.setIpvSessionId(req, res, next);

    // Assert
    expect(req.session.ipvSessionId).to.eq(null);
    expect(next).to.have.been.called;
  });

  it("should throw error if request JWT is missing", async () => {
    // Arrange
    const req = createRequest({
      query: { request: undefined },
    });
    const res = createResponse();

    // Act & Assert
    await expect(middleware.setIpvSessionId(req, res, next)).to.be.rejectedWith(
      BadRequestError,
    );
  });

  it("should throw error if client id is missing", async () => {
    // Arrange
    const req = createRequest({
      query: { client_id: undefined },
    });
    const res = createResponse();

    // Act & Assert
    await expect(middleware.setIpvSessionId(req, res, next)).to.be.rejectedWith(
      BadRequestError,
      "clientId parameter is required",
    );
  });
});
