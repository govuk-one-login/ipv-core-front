import { AxiosError, AxiosResponse, HttpStatusCode } from "axios";
import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";
import pageNotFoundHandler from "./page-not-found-handler";
import journeyEventErrorHandler from "./journey-event-error-handler";
import {
  specifyCreateRequest,
  specifyCreateResponse,
} from "../test-utils/mock-express";

describe("Error handlers", () => {
  // Mock handler parameters
  const createRequest = specifyCreateRequest();
  const createResponse = specifyCreateResponse();
  const next: any = sinon.fake();

  // Setup stubs
  const axiosStub = {
    isAxiosError: sinon.stub().returns(false),
  };
  const { default: serverErrorHandler } = proxyquire(
    "./internal-server-error-handler",
    {
      axios: axiosStub,
    },
  );

  beforeEach(() => {
    next.resetHistory();
    axiosStub.isAxiosError.resetHistory();
  });

  describe("pageNotFoundHandler", () => {
    it("should render page-not-found view", () => {
      // Arrange
      const req = createRequest();
      const res = createResponse();

      // Act
      pageNotFoundHandler(req, res, next);

      // Assert
      expect(res.status).to.have.been.calledOnceWith(HttpStatusCode.NotFound);
      expect(res.render).to.have.been.calledOnceWith(
        "errors/page-not-found.njk",
      );
    });

    it("should call next if headers sent", () => {
      // Arrange
      const req = createRequest();
      const res = createResponse({
        headersSent: true,
      });

      // Act
      pageNotFoundHandler(req, res, next);

      // Assert
      expect(next).to.be.have.been.calledOnce;
    });
  });

  describe("serverErrorHandler", () => {
    it("should render pyi-unrecoverable view when csrf token is invalid", () => {
      // Arrange
      const req = createRequest();
      const res = createResponse();
      const err = new Error("invalid csrf token");

      // Act
      serverErrorHandler(err, req, res, next);

      // Assert
      expect(res.status).to.have.been.calledOnceWith(
        HttpStatusCode.InternalServerError,
      );
      expect(res.render).to.have.been.calledWith("ipv/page/pyi-technical.njk", {
        context: "unrecoverable",
      });
    });

    it("should render pyi-unrecoverable view when unexpected error", () => {
      // Arrange
      const req = createRequest();
      const res = createResponse();
      const err = new Error("internal server error");

      // Act
      serverErrorHandler(err, req, res, next);

      // Assert
      expect(res.status).to.have.been.calledOnceWith(
        HttpStatusCode.InternalServerError,
      );
      expect(res.render).to.have.been.calledWith("ipv/page/pyi-technical.njk", {
        context: "unrecoverable",
      });
    });

    it("should render session-ended view when no session", () => {
      // Arrange
      const req = createRequest();
      const res = createResponse({
        statusCode: HttpStatusCode.Unauthorized,
      });
      const err = new Error("timeout");

      // Act
      serverErrorHandler(err, req, res, next);

      // Assert
      expect(res.render).to.have.been.calledOnceWith(
        "errors/session-ended.njk",
      );
    });

    it("should call next if headers sent", () => {
      // Arrange
      const req = createRequest();
      const res = createResponse({
        headersSent: true,
      });
      const err = new Error("some error");

      // Act
      serverErrorHandler(err, req, res, next);

      // Assert
      expect(next).to.be.have.been.calledOnce;
    });

    it("should log the error if not an axios error", () => {
      // Arrange
      const req = createRequest();
      const res = createResponse();
      const err = new Error("some error");

      // Act
      serverErrorHandler(err, req, res, next);

      // Assert
      expect(req.log.error).to.be.have.been.calledOnce;
    });
  });

  describe("journeyEventErrorHandler", () => {
    it("should render page with provided pageId", () => {
      // Arrange
      const req = createRequest();
      const res = createResponse();
      const err = new AxiosError(
        "some error",
        undefined,
        undefined,
        undefined,
        {
          data: {
            page: "pyi-technical",
            statusCode: HttpStatusCode.BadRequest,
          },
        } as AxiosResponse,
      );

      // Act
      journeyEventErrorHandler(err, req, res, next);

      // Assert
      expect(res.render).to.have.been.calledWith("ipv/page/pyi-technical.njk");
      expect(res.status).to.have.been.calledWith(HttpStatusCode.BadRequest);
    });

    it("should call next with error when there is no pageId", () => {
      // Arrange
      const req = createRequest();
      const res = createResponse();
      const err = new AxiosError(
        "some error",
        undefined,
        undefined,
        undefined,
        {
          data: {
            statusCode: HttpStatusCode.BadRequest,
          },
        } as AxiosResponse,
      );

      // Act
      journeyEventErrorHandler(err, req, res, next);

      // Assert
      expect(next).to.be.calledWith(sinon.match.instanceOf(Error));
    });

    it("should set client OAuth session id", () => {
      // Arrange
      const req = createRequest();
      const res = createResponse();
      const err = new AxiosError(
        "timeout recoverable error",
        undefined,
        undefined,
        undefined,
        {
          data: {
            page: "pyi-timeout-recoverable",
            statusCode: 401,
            clientOAuthSessionId: "fake-session-id",
          },
        } as AxiosResponse,
      );

      // Act
      journeyEventErrorHandler(err, req, res, next);

      // Assert
      expect(req.session.clientOauthSessionId).to.eq("fake-session-id");
      expect(res.render).to.have.been.calledWith(
        "ipv/page/pyi-timeout-recoverable.njk",
      );
      expect(res.status).to.have.been.calledWith(HttpStatusCode.Unauthorized);
    });

    it("should call next if headers sent", () => {
      // Arrange
      const req = createRequest();
      const res = createResponse({
        headersSent: true,
      });
      const err = new Error("some error");

      // Act
      journeyEventErrorHandler(err, req, res, next);

      // Assert
      expect(next).to.be.have.been.calledOnce;
    });
  });
});
