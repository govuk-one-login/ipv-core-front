import sinon from "sinon";
import { expect } from "chai";
import { axiosErrorLogger, axiosResponseLogger } from "./axiosHelper";
import { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import API_URLS from "../../config/config";

const testLogger = {
  info: sinon.fake(),
  warn: sinon.fake(),
  error: sinon.fake(),
};

const testRequest = {
  method: "GET",
  path: "/test-path",
  data: JSON.stringify({ credentialIssuerId: "testCri" }),
  startTime: 100,
  url: API_URLS.API_JOURNEY_EVENT,
  logger: testLogger as any,
} as AxiosRequestConfig;

const testResponse = {
  config: testRequest,
  request: testRequest,
  data: {
    page: "testPage",
  },
  status: 200,
} as AxiosResponse;

describe("axiosHelper", () => {
  beforeEach(() => {
    sinon.useFakeTimers(300);
    testLogger.info.resetHistory();
    testLogger.error.resetHistory();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("responseLogger", () => {
    it("should log response details for allowed endpoints", async () => {
      // Act
      await axiosResponseLogger(testResponse);

      // Assert
      expect(testLogger.info).has.been.calledWith({
        message: {
          description: "API request completed",
          endpoint: "GET /test-path",
          data: {
            page: "testPage",
          },
          cri: "testCri",
          duration: 200,
        },
      });
    });

    it("should not log response data for disallowed endpoints", async () => {
      // Arrange
      const response = {
        ...testResponse,
        config: {
          ...testResponse.config,
          url: "/user/proven-identity-details",
        },
      };

      // Act
      await axiosResponseLogger(response);

      // Assert
      expect(testLogger.info).has.been.calledWith({
        message: {
          description: "API request completed",
          endpoint: "GET /test-path",
          data: undefined,
          cri: "testCri",
          duration: 200,
        },
      });
    });

    it("should redact cri redirect details for allowed endpoints", async () => {
      // Arrange
      const response = {
        ...testResponse,
        data: {
          cri: {
            id: "testCri",
            redirectUrl: "https://example.com/authorize?request=long_request",
          },
        },
      };

      // Act
      await axiosResponseLogger(response);

      // Assert
      expect(testLogger.info).has.been.calledWith({
        message: {
          description: "API request completed",
          endpoint: "GET /test-path",
          data: {
            cri: {
              id: "testCri",
              redirectUrl: "https://example.com/authorize?request=hidden",
            },
          },
          cri: "testCri",
          duration: 200,
        },
      });
    });

    it("should redact client redirect details for allowed endpoints", async () => {
      // Arrange
      const response = {
        ...testResponse,
        data: {
          client: {
            redirectUrl: "https://example.com/callback?code=secret_code",
          },
        },
      };

      // Act
      await axiosResponseLogger(response);

      // Assert
      expect(testLogger.info).has.been.calledWith({
        message: {
          description: "API request completed",
          endpoint: "GET /test-path",
          data: {
            client: {
              redirectUrl: "https://example.com/callback?code=hidden",
            },
          },
          cri: "testCri",
          duration: 200,
        },
      });
    });
  });

  describe("errorLogger", () => {
    it("should log error with response details for allowed endpoints", async () => {
      // Arrange
      const errorResponse = {
        ...testResponse,
        status: 500,
      };

      const error = new AxiosError(
        "test error",
        "ERR",
        testRequest as any,
        testRequest,
        errorResponse,
      );

      // Act
      await expect(axiosErrorLogger(error)).to.be.rejectedWith(error);

      // Assert
      expect(testLogger.warn).has.been.calledWith({
        message: {
          description: "API returned error response",
          endpoint: "GET /test-path",
          data: { page: "testPage" },
          cri: "testCri",
          duration: 200,
          errorMessage: "test error",
          errorStatus: 500,
        },
      });
    });

    it("should not log response data for disallowed endpoints in error responses", async () => {
      // Arrange
      const errorResponse = {
        ...testResponse,
        config: {
          ...testResponse.config,
          url: "/user/proven-identity-details",
        },
        status: 500,
      };

      const error = new AxiosError(
        "test error",
        "ERR",
        testRequest as any,
        testRequest,
        errorResponse,
      );

      // Act
      await expect(axiosErrorLogger(error)).to.be.rejectedWith(error);

      // Assert
      expect(testLogger.warn).has.been.calledWith({
        message: {
          description: "API returned error response",
          endpoint: "GET /test-path",
          data: undefined,
          cri: "testCri",
          duration: 200,
          errorMessage: "test error",
          errorStatus: 500,
        },
      });
    });

    it("should log error with endpoint details for request errors", async () => {
      // Arrange
      const error = new AxiosError(
        "test error",
        "ERR",
        testRequest as any,
        testRequest,
      );

      // Act & Assert
      await expect(axiosErrorLogger(error)).to.be.rejectedWith(error);
      expect(testLogger.error).has.been.calledWith({
        message: {
          description: "Error occurred making request to API",
          endpoint: "GET /test-path",
          errorMessage: "test error",
        },
      });
    });

    it("should log error with internal axios error", async () => {
      // Arrange
      const error = new AxiosError("test error", "ERR", testRequest as any);

      // Act & Assert
      await expect(axiosErrorLogger(error)).to.be.rejectedWith(error);
      expect(testLogger.error).has.been.calledWith({
        message: {
          description: "Something went wrong setting up an API request",
          errorMessage: "test error",
        },
      });
    });

    it("should pass on any non-axios error", async () => {
      // Arrange
      const error = new Error("test error");

      // Act
      await expect(axiosErrorLogger(error)).to.be.rejectedWith(error);

      // Assert
      expect(testLogger.error).to.have.not.been.called;
    });
  });
});
