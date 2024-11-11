import sinon from "sinon";
import { expect } from "chai";
import proxyquire from "proxyquire";
import { AxiosInstance } from "axios";
import { Request } from "express";
import {
  CriCallbackRequest,
  InitialiseSessionRequest,
} from "./coreBackService";

const configStub = {
  API_CRI_CALLBACK: "/cri/callback",
  API_BASE_URL: "https://example.net",
  API_BUILD_PROVEN_USER_IDENTITY_DETAILS: "/proven-identity",
  API_SESSION_INITIALISE: "/session-initialise",
  API_JOURNEY_EVENT: "/journey",
};

describe("CoreBackService", () => {
  const axiosInstanceStub: AxiosInstance = {} as any;
  const passthroughHeaders: typeof import("@govuk-one-login/frontend-passthrough-headers") =
    {} as any;
  let coreBackService: typeof import("./coreBackService");

  const axiosStub = { createAxiosInstance: () => axiosInstanceStub };

  const req: Request = {
    session: {
      clientOauthSessionId: "test_client_session_id",
      ipvSessionId: "test_ipv_session_id",
      featureSet: "test_feature_set",
    },
    id: "test_request_id",
    ip: "127.0.0.1",
    cookies: {
      lng: "en",
    },
  } as any;

  beforeEach(() => {
    axiosInstanceStub.post = sinon.fake();
    axiosInstanceStub.get = sinon.fake();
    passthroughHeaders.createPersonalDataHeaders = sinon.stub().returns({
      "txma-audit-encoded": "dummy-txma-header",
      "x-forwarded-for": "127.0.0.2",
    });

    coreBackService = proxyquire("./coreBackService", {
      "../config/config": { default: configStub },
      "../app/shared/axiosHelper": axiosStub,
      "@govuk-one-login/frontend-passthrough-headers": passthroughHeaders,
    });
  });

  it("should postJourneyEvent with correct parameters and headers", async () => {
    // Arrange
    const event = "test_event";

    // Act
    await coreBackService.postJourneyEvent(req, event);

    // Assert
    expect(axiosInstanceStub.post).to.have.been.calledWith(
      "/journey/test_event",
      {},
      {
        headers: {
          "content-type": "application/json",
          "x-request-id": "test_request_id",
          "ip-address": "127.0.0.2",
          language: "en",
          "feature-set": "test_feature_set",
          "ipv-session-id": "test_ipv_session_id",
          "client-session-id": "test_client_session_id",
          "txma-audit-encoded": "dummy-txma-header",
          "x-forwarded-for": "127.0.0.2",
        },
        logger: undefined,
      },
    );
  });

  it("should postSessionInitialise with correct parameters and headers", async () => {
    // Arrange
    const body = {} as InitialiseSessionRequest;

    // Act
    await coreBackService.postSessionInitialise(req, body);

    // Assert
    expect(axiosInstanceStub.post).to.have.been.calledWith(
      "/session-initialise",
      body,
      {
        headers: {
          "content-type": "application/json",
          "x-request-id": "test_request_id",
          "ip-address": "127.0.0.2",
          language: "en",
          "feature-set": "test_feature_set",
          "ipv-session-id": "test_ipv_session_id",
          "client-session-id": "test_client_session_id",
          "txma-audit-encoded": "dummy-txma-header",
          "x-forwarded-for": "127.0.0.2",
        },
        logger: undefined,
      },
    );
  });

  it("should postCriCallback with correct parameters and headers", async () => {
    // Arrange
    const body = {} as CriCallbackRequest;

    // Act
    await coreBackService.postCriCallback(req, body);

    // Assert
    expect(axiosInstanceStub.post).to.have.been.calledWith(
      "/cri/callback",
      body,
      {
        headers: {
          "content-type": "application/json",
          "x-request-id": "test_request_id",
          "ip-address": "127.0.0.2",
          language: "en",
          "feature-set": "test_feature_set",
          "ipv-session-id": "test_ipv_session_id",
          "client-session-id": "test_client_session_id",
          "txma-audit-encoded": "dummy-txma-header",
          "x-forwarded-for": "127.0.0.2",
        },
        logger: undefined,
      },
    );
  });

  it("should getProvenIdentityUserDetails to retrieve user identity details", async () => {
    // Act
    await coreBackService.getProvenIdentityUserDetails(req);

    // Assert
    expect(axiosInstanceStub.get).to.have.been.calledWith("/proven-identity", {
      headers: {
        "content-type": "application/json",
        "x-request-id": "test_request_id",
        "ip-address": "127.0.0.2",
        language: "en",
        "feature-set": "test_feature_set",
        "ipv-session-id": "test_ipv_session_id",
        "client-session-id": "test_client_session_id",
        "txma-audit-encoded": "dummy-txma-header",
        "x-forwarded-for": "127.0.0.2",
      },
      logger: undefined,
    });
  });
});
