import { expect } from "chai";
import { NextFunction, Request, Response } from "express";
import proxyquire from "proxyquire";
import sinon from "sinon";

describe("mobile app middleware", () => {
  describe("checkMobileAppDetails", function () {
    let req: Request;
    let res: Response;
    let next: NextFunction;

    const configStub = {
      API_MOBILE_APP_CALLBACK: "/app/callback",
      API_BASE_URL: "https://example.net/path",
    };
    const coreBackServiceStub = {
      postMobileAppCallback: sinon.fake(),
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
          state: "oauth-state",
        },
        log: { info: sinon.fake(), error: sinon.fake() },
      } as unknown as Request;
      res = {
        status: sinon.fake(),
        redirect: sinon.fake(),
      } as unknown as Response;
      next = sinon.fake();
    });

    it("should call core-back with correct parameters", async () => {
      coreBackServiceStub.postMobileAppCallback = sinon.fake();

      const expectedBody = {
        state: req.query.state,
      };

      await middleware.checkMobileAppDetails(req, res, next);

      expect(coreBackServiceStub.postMobileAppCallback).to.have.been.calledWith(
        req,
        expectedBody,
      );
    });
  });
});
