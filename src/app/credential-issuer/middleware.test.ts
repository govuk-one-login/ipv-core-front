import { AxiosError, AxiosResponse } from "axios";
import { expect } from "chai";
import { NextFunction, Request, Response } from "express";
import proxyquire from "proxyquire";
import sinon from "sinon";

describe("credential issuer middleware", () => {
  describe("sendParamsToAPI", function () {
    let req: Request;
    let res: Response;
    let next: NextFunction;
    let axiosResponse: AxiosResponse;

    const configStub = {
      API_CRI_CALLBACK: "/cri/callback",
      API_BASE_URL: "https://example.net/path",
      CREDENTIAL_ISSUER_ID: "testCredentialIssuerId",
      EXTERNAL_WEBSITE_HOST: "http://example.com",
    };
    const coreBackServiceStub = {
      postCriCallback: sinon.fake(),
    };
    const ipvMiddlewareStub = {
      handleBackendResponse: sinon.fake(),
    };

    let middleware: typeof import("./middleware");

    beforeEach(() => {
      middleware = proxyquire("./middleware", {
        "../../services/coreBackService": coreBackServiceStub,
        "../../lib/config": { default: configStub },
        "../ipv/middleware": ipvMiddlewareStub,
      });

      req = {
        id: "1",
        params: {},
        csrfToken: sinon.fake(),
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
        log: { info: sinon.fake(), error: sinon.fake() },
      } as any;
      res = {
        status: sinon.fake(),
        redirect: sinon.fake(),
      } as any;
      next = sinon.fake() as any;
      axiosResponse = {
        status: {},
      } as any;
    });

    it("should call core-back with correct parameters", async () => {
      req.session.ipvSessionId = "abadcafe";
      req.session.ipAddress = "ip-address";
      coreBackServiceStub.postCriCallback = sinon.fake();

      const expectedBody = {
        authorizationCode: req.query.code,
        credentialIssuerId: req.query.id,
        redirectUri: `http://example.com/credential-issuer/callback?id=${req.query.id}`,
        state: req.query.state,
      };

      await middleware.sendParamsToAPI(req, res, next);

      expect(coreBackServiceStub.postCriCallback).to.have.been.calledWith(
        req,
        expectedBody,
      );
    });

    it("should add error parameters if they exist", async () => {
      req.session.ipvSessionId = "abadcafe";
      req.session.ipAddress = "ip-address";
      coreBackServiceStub.postCriCallback = sinon.fake();

      req.query.error = "access_denied";
      req.query.error_description = "Access was denied!";

      const expectedBody = {
        authorizationCode: req.query.code,
        credentialIssuerId: req.query.id,
        redirectUri: `http://example.com/credential-issuer/callback?id=${req.query.id}`,
        state: req.query.state,
        error: req.query.error,
        errorDescription: req.query.error_description,
      };

      await middleware.sendParamsToAPI(req, res, next);

      expect(coreBackServiceStub.postCriCallback).to.have.been.calledWith(
        req,
        expectedBody,
      );
    });

    it("should send code to core backend and return with 200 response", async () => {
      axiosResponse.status = 200;
      axiosResponse.data = { journey: "journey/next" };
      coreBackServiceStub.postCriCallback = sinon.fake.resolves(axiosResponse);

      await middleware.sendParamsToAPI(req, res, next);

      expect(res.status).to.be.calledWith(200);
    });

    it("should call /journey/next", async () => {
      axiosResponse.data = {
        journey: "journey/next",
      };
      coreBackServiceStub.postCriCallback = sinon.fake.resolves(axiosResponse);

      await middleware.sendParamsToAPI(req, res, next);

      expect(
        ipvMiddlewareStub.handleBackendResponse.lastCall.lastArg.journey,
      ).to.equal("journey/next");
    });

    it("should send code to core backend and call next with error", async () => {
      axiosResponse.status = 404;
      const axiosError = new AxiosError("api error");
      axiosError.response = axiosResponse;
      coreBackServiceStub.postCriCallback = sinon.fake.throws(axiosError);

      await middleware.sendParamsToAPI(req, res, next);

      expect(next).to.be.calledWith(sinon.match.instanceOf(Error));
    });

    it("should call cri callback when ipvSessionId is missing", async () => {
      coreBackServiceStub.postCriCallback = sinon.fake();
      req.session.ipvSessionId = undefined;

      await middleware.sendParamsToAPI(req, res, next);

      const expectedBody = {
        authorizationCode: req.query.code,
        credentialIssuerId: req.query.id,
        redirectUri: `http://example.com/credential-issuer/callback?id=${req.query.id}`,
        state: req.query.state,
      };

      expect(coreBackServiceStub.postCriCallback).to.have.been.calledWith(
        req,
        expectedBody,
      );
    });
  });

  describe("sendParamsToAPIV2", function () {
    let req: Request;
    let res: Response;
    let next: NextFunction;
    let axiosResponse: AxiosResponse;

    const configStub = {
      API_CRI_CALLBACK: "/cri/callback",
      API_BASE_URL: "https://example.net/path",
      CREDENTIAL_ISSUER_ID: "testCredentialIssuerId",
      EXTERNAL_WEBSITE_HOST: "http://example.com",
    };
    const coreBackServiceStub = {
      postCriCallback: sinon.fake(),
    };
    const ipvMiddlewareStub = {
      handleBackendResponse: sinon.fake(),
    };

    let middleware: typeof import("./middleware");

    beforeEach(() => {
      middleware = proxyquire("./middleware", {
        "../../services/coreBackService": coreBackServiceStub,
        "../../lib/config": { default: configStub },
        "../ipv/middleware": ipvMiddlewareStub,
      });

      req = {
        id: "1",
        params: {},
        csrfToken: sinon.fake(),
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
        log: { info: sinon.fake(), error: sinon.fake() },
      } as any;
      res = {
        status: sinon.fake(),
        redirect: sinon.fake(),
      } as any;
      next = sinon.fake() as any;
      axiosResponse = {
        status: {},
      } as any;
    });

    it("should call axios with correct parameters", async () => {
      req.session.ipvSessionId = "abadcafe";
      req.session.ipAddress = "ip-address";
      coreBackServiceStub.postCriCallback = sinon.fake();

      const expectedBody = {
        authorizationCode: req.query.code,
        credentialIssuerId: req.params.criId,
        redirectUri: `http://example.com/credential-issuer/callback/${req.params.criId}`,
        state: req.query.state,
      };

      await middleware.sendParamsToAPIV2(req, res, next);

      expect(coreBackServiceStub.postCriCallback).to.have.been.calledWith(
        req,
        expectedBody,
      );
    });

    it("should add error parameters if they exist", async () => {
      req.session.ipvSessionId = "abadcafe";
      req.session.ipAddress = "ip-address";
      coreBackServiceStub.postCriCallback = sinon.fake();

      req.query.error = "access_denied";
      req.query.error_description = "Access was denied!";

      const expectedBody = {
        authorizationCode: req.query.code,
        credentialIssuerId: req.params.criId,
        redirectUri: `http://example.com/credential-issuer/callback/${req.params.criId}`,
        state: req.query.state,
        error: req.query.error,
        errorDescription: req.query.error_description,
      };

      await middleware.sendParamsToAPIV2(req, res, next);

      expect(coreBackServiceStub.postCriCallback).to.have.been.calledWith(
        req,
        expectedBody,
      );
    });

    it("should send code to core backend and return with 200 response", async () => {
      axiosResponse.status = 200;
      axiosResponse.data = { journey: "journey/next" };
      coreBackServiceStub.postCriCallback = sinon.fake.resolves(axiosResponse);

      await middleware.sendParamsToAPIV2(req, res, next);

      expect(res.status).to.be.calledWith(200);
    });

    it("should call /journey/next", async () => {
      axiosResponse.data = {
        journey: "journey/next",
      };
      coreBackServiceStub.postCriCallback = sinon.fake.resolves(axiosResponse);

      await middleware.sendParamsToAPIV2(req, res, next);

      expect(
        ipvMiddlewareStub.handleBackendResponse.lastCall.lastArg.journey,
      ).to.equal("journey/next");
    });

    it("should send code to core backend and call next with error", async () => {
      axiosResponse.status = 404;
      const axiosError = new AxiosError("api error");
      axiosError.response = axiosResponse;
      coreBackServiceStub.postCriCallback = sinon.fake.throws(axiosError);

      await middleware.sendParamsToAPIV2(req, res, next);

      expect(next).to.be.calledWith(sinon.match.instanceOf(Error));
    });

    it("should call cri callback when ipvSessionId is missing", async () => {
      coreBackServiceStub.postCriCallback = sinon.fake();
      req.session.ipvSessionId = undefined;

      const expectedBody = {
        authorizationCode: req.query.code,
        credentialIssuerId: req.params.criId,
        redirectUri: `http://example.com/credential-issuer/callback/${req.params.criId}`,
        state: req.query.state,
      };

      await middleware.sendParamsToAPIV2(req, res, next);

      expect(coreBackServiceStub.postCriCallback).to.have.been.calledWith(
        req,
        expectedBody,
      );
    });
  });
});
