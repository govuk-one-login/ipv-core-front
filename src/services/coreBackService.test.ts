import sinon from "sinon";
import { expect } from "chai";
import proxyquire from "proxyquire";
import {
  CriCallbackRequest,
  InitialiseSessionRequest,
} from "./coreBackService";
import { specifyCreateRequest } from "../test-utils/mock-express";

describe("CoreBackService", () => {
  // Mock handler parameters
  const createRequest = specifyCreateRequest({
    id: "test_request_id",
    ip: "127.0.0.1",
    session: {
      clientOauthSessionId: "test_client_session_id",
      ipvSessionId: "test_ipv_session_id",
      featureSet: "test_feature_set",
    },
    cookies: { lng: "en" },
  });

  // Setup stubs
  const axiosInstanceStub = {
    get: sinon.fake(),
    post: sinon.fake(),
  } as any;
  const passthroughHeaders = {
    createPersonalDataHeaders: sinon.stub().returns({
      "txma-audit-encoded": "dummy-txma-header",
      "x-forwarded-for": "127.0.0.2",
    }),
  } as any;
  const configStub = {
    API_CRI_CALLBACK: "/cri/callback",
    API_BASE_URL: "https://example.net",
    API_BUILD_PROVEN_USER_IDENTITY_DETAILS: "/proven-identity",
    API_SESSION_INITIALISE: "/session-initialise",
    API_JOURNEY_EVENT: "/journey",
  };
  const coreBackService: typeof import("./coreBackService") = proxyquire(
    "./coreBackService",
    {
      "../lib/config": { default: configStub },
      "../app/shared/axiosHelper": {
        createAxiosInstance: () => axiosInstanceStub,
      },
      "@govuk-one-login/frontend-passthrough-headers": passthroughHeaders,
    },
  );

  beforeEach(() => {
    axiosInstanceStub.get.resetHistory();
    axiosInstanceStub.post.resetHistory();
    passthroughHeaders.createPersonalDataHeaders.resetHistory();
  });

  it("should postJourneyEvent with correct parameters and headers", async () => {
    // Arrange
    const req = createRequest();
    const event = "test_event";

    // Act
    await coreBackService.postJourneyEvent(req, event);

    // Assert
    expect(axiosInstanceStub.post).to.have.been.calledWithMatch(
      "/journey/test_event",
      {},
      {
        headers: sinon.match({
          "content-type": "application/json",
          "x-request-id": "test_request_id",
          "ip-address": "127.0.0.2",
          language: "en",
          "feature-set": "test_feature_set",
          "ipv-session-id": "test_ipv_session_id",
          "client-session-id": "test_client_session_id",
          "txma-audit-encoded": "dummy-txma-header",
          "x-forwarded-for": "127.0.0.2",
        }),
      },
    );
  });

  it("should postSessionInitialise with correct parameters and headers", async () => {
    // Arrange
    const req = createRequest();
    const body = {} as InitialiseSessionRequest;

    // Act
    await coreBackService.postSessionInitialise(req, body);

    // Assert
    expect(axiosInstanceStub.post).to.have.been.calledWithMatch(
      "/session-initialise",
      body,
      {
        headers: sinon.match({
          "content-type": "application/json",
          "x-request-id": "test_request_id",
          "ip-address": "127.0.0.2",
          language: "en",
          "feature-set": "test_feature_set",
          "ipv-session-id": "test_ipv_session_id",
          "client-session-id": "test_client_session_id",
          "txma-audit-encoded": "dummy-txma-header",
          "x-forwarded-for": "127.0.0.2",
        }),
      },
    );
  });

  it("should postCriCallback with correct parameters and headers", async () => {
    // Arrange
    const req = createRequest();
    const body = {} as CriCallbackRequest;

    // Act
    await coreBackService.postCriCallback(req, body);

    // Assert
    expect(axiosInstanceStub.post).to.have.been.calledWithMatch(
      "/cri/callback",
      body,
      {
        headers: sinon.match({
          "content-type": "application/json",
          "x-request-id": "test_request_id",
          "ip-address": "127.0.0.2",
          language: "en",
          "feature-set": "test_feature_set",
          "ipv-session-id": "test_ipv_session_id",
          "client-session-id": "test_client_session_id",
          "txma-audit-encoded": "dummy-txma-header",
          "x-forwarded-for": "127.0.0.2",
        }),
      },
    );
  });

  it("should getProvenIdentityUserDetails to retrieve user identity details", async () => {
    // Act
    const req = createRequest();
    await coreBackService.getProvenIdentityUserDetails(req);

    // Assert
    expect(axiosInstanceStub.get).to.have.been.calledWithMatch(
      "/proven-identity",
      {
        headers: sinon.match({
          "content-type": "application/json",
          "x-request-id": "test_request_id",
          "ip-address": "127.0.0.2",
          language: "en",
          "feature-set": "test_feature_set",
          "ipv-session-id": "test_ipv_session_id",
          "client-session-id": "test_client_session_id",
          "txma-audit-encoded": "dummy-txma-header",
          "x-forwarded-for": "127.0.0.2",
        }),
      },
    );
  });
});
