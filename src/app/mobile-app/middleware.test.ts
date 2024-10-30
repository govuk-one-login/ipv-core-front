import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { NextFunction, Request, Response } from "express";
import proxyquire from "proxyquire";
import sinon from "sinon";
import { AxiosError, AxiosResponse } from "axios";

chai.use(chaiAsPromised);

describe("mobile app middleware", () => {
  describe("checkMobileAppDetails", function () {
    let req: Request;
    let res: Response;
    let next: NextFunction;
    let axiosResponse: AxiosResponse;

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
      next = sinon.fake() as any;
      axiosResponse = {
        status: {},
      } as any;
    });

    it("callback returns next event", async () => {
      // Arrange
      axiosResponse.status = 200;
      axiosResponse.data = { journey: "journey/next" };
      coreBackServiceStub.postMobileAppCallback =
        sinon.fake.resolves(axiosResponse);

      // Act
      await middleware.checkMobileAppDetails(req, res, next);

      // Assert
      expect(coreBackServiceStub.postMobileAppCallback).to.have.been.calledWith(
        req,
        { state: req.query.state },
      );
      expect(
        ipvMiddlewareStub.handleBackendResponse.lastCall.lastArg.journey,
      ).to.equal("journey/next");
      expect(res.status).to.be.calledWith(200);
    });

    it("failed callback is propagated", async () => {
      // Arrange
      const axiosError = new AxiosError("api error");
      axiosResponse.status = 404;
      axiosError.response = axiosResponse;
      coreBackServiceStub.postMobileAppCallback = sinon.fake.throws(axiosError);

      // Act
      await middleware.checkMobileAppDetails(req, res, next);

      // Assert
      expect(next).to.be.calledWith(sinon.match.instanceOf(Error));
    });

    it("missing state query parameter throws error", async () => {
      // Arrange
      req.query = {};

      // Act & Assert
      await expect(
        middleware.checkMobileAppDetails(req, res, next),
      ).to.be.rejectedWith("Missing state query param");
    });
  });
});
