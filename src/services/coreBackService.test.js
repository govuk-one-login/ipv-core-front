const sinon = require("sinon");
const { expect } = require("chai");
const proxyquire = require("proxyquire");

const configStub = {
  API_CRI_CALLBACK: "/cri/callback",
  API_BASE_URL: "https://example.net",
  API_BUILD_PROVEN_USER_IDENTITY_DETAILS: "/proven-identity",
  API_SESSION_INITIALISE: "/session-initialise",
};

describe("CoreBackService", () => {
  let axiosInstanceStub = {};
  let axiosStub = { create: () => axiosInstanceStub };
  let CoreBackService;

  const req = {
    session: {
      clientOauthSessionId: "test_client_session_id",
      ipvSessionId: "test_ipv_session_id",
      ipAddress: "127.0.0.1",
      featureSet: "test_feature_set",
    },
    id: "test_request_id",
  };

  beforeEach(() => {
    axiosInstanceStub.post = sinon.fake();
    axiosInstanceStub.get = sinon.fake();

    CoreBackService = proxyquire("./coreBackService", {
      axios: axiosStub,
      "../lib/config": configStub,
    });
  });

  it("should postAction with correct parameters and headers", async () => {
    // Arrange
    const action = "test_action";

    // Act
    await CoreBackService.postAction(req, action);

    // Assert
    expect(axiosInstanceStub.post).to.have.been.calledWith(
      "/test_action",
      {},
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "ipv-session-id": "test_ipv_session_id",
          "client-session-id": "test_client_session_id",
          "x-request-id": "test_request_id",
          "ip-address": "127.0.0.1",
          "feature-set": "test_feature_set",
        },
      },
    );
  });

  it("should postSessionInitialise with correct parameters and headers", async () => {
    // Arrange
    const authParams = { someAuthParam: "someValue" };

    // Act
    await CoreBackService.postSessionInitialise(req, authParams);

    // Assert
    expect(axiosInstanceStub.post).to.have.been.calledWith(
      "/session-initialise",
      { someAuthParam: "someValue" },
      {
        headers: {
          "ip-address": "127.0.0.1",
          "feature-set": "test_feature_set",
        },
      },
    );
  });

  it("should postCriCallback with correct parameters and headers", async () => {
    // Arrange
    const body = { test_param: "someValue" };
    const errorDetails = { error_param: "anotherValue" };

    // Act
    await CoreBackService.postCriCallback(req, body, errorDetails);

    // Assert
    expect(axiosInstanceStub.post).to.have.been.calledWith(
      "/cri/callback",
      { test_param: "someValue", error_param: "anotherValue" },
      {
        headers: {
          "Content-Type": "application/json",
          "ipv-session-id": "test_ipv_session_id",
          "x-request-id": "test_request_id",
          "ip-address": "127.0.0.1",
          "feature-set": "test_feature_set",
        },
      },
    );
  });

  it("should getProvenIdentityUserDetails to retrieve user identity details", async () => {
    // Arrange
    const body = { test_param: "someValue" };
    const errorDetails = { error_param: "anotherValue" };

    // Act
    await CoreBackService.getProvenIdentityUserDetails(req, body, errorDetails);

    // Assert
    expect(axiosInstanceStub.get).to.have.been.calledWith("/proven-identity", {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "ipv-session-id": "test_ipv_session_id",
        "x-request-id": "test_request_id",
        "ip-address": "127.0.0.1",
        "feature-set": "test_feature_set",
      },
    });
  });
});
