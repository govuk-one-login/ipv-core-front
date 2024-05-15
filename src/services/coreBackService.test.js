const sinon = require("sinon");
const { expect } = require("chai");
const proxyquire = require("proxyquire");
const {
  createPersonalDataHeaders,
} = require("@govuk-one-login/frontend-passthrough-headers");

const configStub = {
  API_CRI_CALLBACK: "/cri/callback",
  API_BASE_URL: "https://example.net",
  API_BUILD_PROVEN_USER_IDENTITY_DETAILS: "/proven-identity",
  API_SESSION_INITIALISE: "/session-initialise",
  API_JOURNEY_EVENT: "/journey",
};
describe("CoreBackService", () => {
  let axiosInstanceStub = {};
  let CoreBackService;

  let axiosStub = { createAxiosInstance: () => axiosInstanceStub };

  const req = {
    session: {
      clientOauthSessionId: "test_client_session_id",
      ipvSessionId: "test_ipv_session_id",
      featureSet: "test_feature_set",
    },
    id: "test_request_id",
    ip: "127.0.0.1",
  };

  beforeEach(() => {
    axiosInstanceStub.post = sinon.fake();
    axiosInstanceStub.get = sinon.fake();

    CoreBackService = proxyquire("./coreBackService", {
      "../lib/config": configStub,
      "../app/shared/axiosHelper": axiosStub,
    });
  });

  it("should postJourneyEvent with correct parameters and headers", async () => {
    // Arrange
    const event = "test_event";
    req.headers = {
      "txma-audit-encoded": "dummy-txma-header",
      "x-forwarded-for": "198.51.100.10:46532",
    };

    // Act
    await CoreBackService.postJourneyEvent(req, event);

    // Assert
    expect(axiosInstanceStub.post).to.have.been.calledWith(
      "/journey/test_event",
      {},
      {
        headers: {
          "content-type": "application/json",
          "x-request-id": "test_request_id",
          "ip-address": "127.0.0.1",
          "feature-set": "test_feature_set",
          "ipv-session-id": "test_ipv_session_id",
          "client-session-id": "test_client_session_id",
          ...createPersonalDataHeaders(
            `${configStub.API_BASE_URL}${configStub.API_JOURNEY_EVENT}`,
            req,
          ),
        },
        logger: undefined,
      },
    );
  });

  it("should postSessionInitialise with correct parameters and headers", async () => {
    // Arrange
    const authParams = { someAuthParam: "someValue" };
    req.headers = {
      "txma-audit-encoded": "dummy-txma-header",
      "x-forwarded-for": "198.51.100.10:46532",
    };

    // Act
    await CoreBackService.postSessionInitialise(req, authParams);

    // Assert
    expect(axiosInstanceStub.post).to.have.been.calledWith(
      "/session-initialise",
      { someAuthParam: "someValue" },
      {
        headers: {
          "content-type": "application/json",
          "x-request-id": "test_request_id",
          "ip-address": "127.0.0.1",
          "feature-set": "test_feature_set",
          "ipv-session-id": "test_ipv_session_id",
          "client-session-id": "test_client_session_id",
          ...createPersonalDataHeaders(
            `${configStub.API_BASE_URL}${configStub.API_SESSION_INITIALISE}`,
            req,
          ),
        },
        logger: undefined,
      },
    );
  });

  it("should postCriCallback with correct parameters and headers", async () => {
    // Arrange
    const body = { test_param: "someValue" };
    const errorDetails = { error_param: "anotherValue" };
    req.headers = {
      "txma-audit-encoded": "dummy-txma-header",
      "x-forwarded-for": "198.51.100.10:46532",
    };

    // Act
    await CoreBackService.postCriCallback(req, body, errorDetails);

    // Assert
    expect(axiosInstanceStub.post).to.have.been.calledWith(
      "/cri/callback",
      { test_param: "someValue", error_param: "anotherValue" },
      {
        headers: {
          "content-type": "application/json",
          "x-request-id": "test_request_id",
          "ip-address": "127.0.0.1",
          "feature-set": "test_feature_set",
          "ipv-session-id": "test_ipv_session_id",
          "client-session-id": "test_client_session_id",
          ...createPersonalDataHeaders(
            `${configStub.API_BASE_URL}${configStub.API_CRI_CALLBACK}`,
            req,
          ),
        },
        logger: undefined,
      },
    );
  });

  it("should getProvenIdentityUserDetails to retrieve user identity details", async () => {
    // Arrange
    const body = { test_param: "someValue" };
    const errorDetails = { error_param: "anotherValue" };
    req.headers = {
      "txma-audit-encoded": "dummy-txma-header",
      "x-forwarded-for": "198.51.100.10:46532",
    };

    // Act
    await CoreBackService.getProvenIdentityUserDetails(req, body, errorDetails);
    // Assert
    expect(axiosInstanceStub.get).to.have.been.calledWith("/proven-identity", {
      headers: {
        "content-type": "application/json",
        "x-request-id": "test_request_id",
        "ip-address": "127.0.0.1",
        "feature-set": "test_feature_set",
        "ipv-session-id": "test_ipv_session_id",
        "client-session-id": "test_client_session_id",
        ...createPersonalDataHeaders(
          `${configStub.API_BASE_URL}${configStub.API_BUILD_PROVEN_USER_IDENTITY_DETAILS}`,
          req,
        ),
      },
      logger: undefined,
    });
  });
});
