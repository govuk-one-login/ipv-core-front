import { AxiosError, AxiosResponse, HttpStatusCode } from "axios";
import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";
import {
  specifyCreateRequest,
  specifyCreateResponse,
} from "../../test-utils/mock-express";
import BadRequestError from "../../errors/bad-request-error";

describe("credential issuer middleware", () => {
  // Mock handler parameters
  const createRequest = specifyCreateRequest({
    params: { criId: "PassportIssuer" },
    session: {
      ipvSessionId: "ipv-session-id",
      ipAddress: "ip-address",
      featureSet: "feature-set",
    },
    query: {
      id: "PassportIssuer",
      code: "authorize-code-issued",
      state: "oauth-state",
    },
  });
  const createResponse = specifyCreateResponse();
  const next: any = sinon.fake();

  // Setup stubs
  const configStub = {
    API_CRI_CALLBACK: "/cri/callback",
    API_BASE_URL: "https://example.net/path",
    CREDENTIAL_ISSUER_ID: "testCredentialIssuerId",
    EXTERNAL_WEBSITE_HOST: "http://example.com",
  };
  const coreBackServiceStub = {
    postCriCallback: sinon.stub(),
  };
  const ipvMiddlewareStub = { handleBackendResponse: sinon.stub() };
  const middleware = proxyquire("./middleware", {
    "../../services/coreBackService": coreBackServiceStub,
    "../../config/config": { default: configStub },
    "../ipv/middleware": ipvMiddlewareStub,
  });

  beforeEach(() => {
    next.resetHistory();
    coreBackServiceStub.postCriCallback.resolves({});
    ipvMiddlewareStub.handleBackendResponse.resetHistory();
  });

  (
    [
      {
        method: "sendParamsToAPI",
        getExpectedRedirectUri: (id: string) =>
          `http://example.com/credential-issuer/callback?id=${id}`,
      },
      {
        method: "sendParamsToAPIV2",
        getExpectedRedirectUri: (id: string) =>
          `http://example.com/credential-issuer/callback/${id}`,
      },
    ] as const
  ).forEach(({ method, getExpectedRedirectUri }) => {
    describe(method, () => {
      it("should call core-back with correct parameters", async () => {
        // Arrange
        const req = createRequest({
          session: { ipvSessionId: "test-ipv-session-id" },
        });
        const res = createResponse();

        // Act
        await middleware[method](req, res, next);

        // Assert
        expect(coreBackServiceStub.postCriCallback).to.have.been.calledWith(
          req,
          {
            authorizationCode: req.query.code,
            credentialIssuerId: req.query.id,
            redirectUri: getExpectedRedirectUri(req.query.id as string),
            state: req.query.state,
          },
        );
      });

      it("should add error parameters if they exist", async () => {
        // Arrange
        const req = createRequest({
          query: {
            error: "access_denied",
            error_description: "Access was denied!",
          },
        });
        const res = createResponse();

        // Act
        await middleware[method](req, res, next);

        // Assert
        expect(coreBackServiceStub.postCriCallback).to.have.been.calledWith(
          req,
          {
            authorizationCode: req.query.code,
            credentialIssuerId: req.query.id,
            redirectUri: getExpectedRedirectUri(req.query.id as string),
            state: req.query.state,
            error: req.query.error,
            errorDescription: req.query.error_description,
          },
        );
      });

      it("should handle /journey/next from response", async () => {
        // Arrange
        const req = createRequest();
        const res = createResponse();
        const apiResponse = {
          data: { journey: "journey/next" },
        };
        coreBackServiceStub.postCriCallback.resolves(apiResponse);

        // Act
        await middleware[method](req, res, next);

        // Assert
        expect(ipvMiddlewareStub.handleBackendResponse).to.have.been.calledWith(
          req,
          res,
          apiResponse,
          "PassportIssuer",
        );
      });

      it("should call next with error on failed core-back response", async () => {
        // Arrange
        const req = createRequest();
        const res = createResponse();
        coreBackServiceStub.postCriCallback.throws(
          new AxiosError("api error", undefined, undefined, undefined, {
            status: HttpStatusCode.NotFound,
          } as AxiosResponse),
        );

        // Act & Assert
        await expect(middleware[method](req, res, next)).to.be.rejectedWith(
          Error,
          "api error",
        );
      });

      it("should call core-back when ipvSessionId is missing", async () => {
        // Arrange
        const req = createRequest({ session: undefined });
        const res = createResponse();

        // Act
        await middleware[method](req, res, next);

        // Assert
        expect(coreBackServiceStub.postCriCallback).to.have.been.calledWith(
          req,
          {
            authorizationCode: req.query.code,
            credentialIssuerId: req.query.id,
            redirectUri: getExpectedRedirectUri(req.query.id as string),
            state: req.query.state,
          },
        );
      });
    });
  });

  describe("sendParamsToAPI specific validation", () => {
    it("should throw BadRequestError if id is missing in query", async () => {
      // Arrange
      const req = createRequest({
        query: { id: null },
      });
      const res = createResponse();

      // Act & Assert
      await expect(
        middleware.sendParamsToAPI(req, res, next),
      ).to.be.rejectedWith(BadRequestError, "id parameter is required");
    });
  });
});
