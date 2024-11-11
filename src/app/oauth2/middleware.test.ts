import proxyquire from "proxyquire";
import { expect } from "chai";
import sinon from "sinon";
import { NextFunction, Request, Response } from "express";
import { AxiosResponse } from "axios";
import TechnicalError from "../../errors/technical-error";
import BadRequestError from "../../errors/bad-request-error";

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

describe("oauth middleware", () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      session: {},
      log: { info: sinon.fake(), error: sinon.fake() },
    } as any;

    res = {
      status: sinon.fake(),
      redirect: sinon.fake(),
      send: sinon.fake(),
      render: sinon.fake(),
    } as any;

    next = sinon.fake() as any;
  });

  describe("setIpvSessionId", () => {
    let axiosResponse: AxiosResponse;

    beforeEach(() => {
      req = {
        log: { info: sinon.fake(), error: sinon.fake() },
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
      } as any;
      axiosResponse = {
        data: {
          ipvSessionId: {},
        },
      } as any;
    });

    it("should pass next journey event when handling OAuth Call", async () => {
      try {
        coreBackServiceStub.postJourneyEvent =
          sinon.fake.resolves(axiosResponse);

        await middleware.handleOAuthJourneyAction(req, res, next);
      } catch (error) {
        expect(coreBackServiceStub.postJourneyEvent).to.have.been.called;
        expect(error).to.be.an.instanceOf(Error);
      }
    });

    it("should pass next journey event by default when handling OAuth Call", async () => {
      try {
        coreBackServiceStub.postJourneyEvent =
          sinon.fake.resolves(axiosResponse);
        req.body.journey = "journey/nonsense";

        await middleware.handleOAuthJourneyAction(req, res, next);
      } catch (error) {
        expect(coreBackServiceStub.postJourneyEvent).to.have.been.called;
        expect(error).to.be.an.instanceOf(Error);
      }
    });

    it("should throw error when handling OAuth Call if missing ipvSessionId", async () => {
      coreBackServiceStub.postJourneyEvent = sinon.fake();
      req.session.ipvSessionId = undefined;

      await expect(
        (async () =>
          await middleware.handleOAuthJourneyAction(req, res, next))(),
      ).to.be.rejectedWith(TechnicalError, "missing ipvSessionId");
    });

    it("should set ipvSessionId in session", async () => {
      axiosResponse.data.ipvSessionId = "abadcafe";

      coreBackServiceStub.postSessionInitialise =
        sinon.fake.returns(axiosResponse);

      await middleware.setIpvSessionId(req, res, next);

      expect(req.session.ipvSessionId).to.eq(axiosResponse.data.ipvSessionId);
      expect(next).to.have.been.called;
    });

    it("should set ipvSessionId as null in session if response contains null", async () => {
      axiosResponse.data.ipvSessionId = null;

      coreBackServiceStub.postSessionInitialise =
        sinon.fake.returns(axiosResponse);

      await middleware.setIpvSessionId(req, res, next);

      expect(req.session.ipvSessionId).to.eq(null);
      expect(next).to.have.been.called;
    });

    it("should throw error if request JWT is missing", async () => {
      req.query.request = undefined;

      await expect(
        (async () => await middleware.setIpvSessionId(req, res, next))(),
      ).to.be.rejectedWith(BadRequestError);
    });

    it("should throw error if client id is missing", async () => {
      req.query.client_id = undefined;

      await expect(
        (async () => await middleware.setIpvSessionId(req, res, next))(),
      ).to.be.rejectedWith(BadRequestError, "clientId parameter is required");
    });
  });
});
