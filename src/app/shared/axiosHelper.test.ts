import sinon from "sinon";
import { expect } from "chai";
import { axiosErrorLogger, axiosResponseLogger } from "./axiosHelper";
import { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

const testLogger = {
  info: sinon.fake(),
  error: sinon.fake(),
};

const testRequest = {
  method: "GET",
  path: "/test-path",
  data: JSON.stringify({ credentialIssuerId: "testCri" }),
  startTime: 100,
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
    it("should log response details", async () => {
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

    it("should not log cri redirect details", async () => {
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

    it("should not log client redirect details", async () => {
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

    it("should not log anything for proven-identity-details endpoint", async () => {
      // Arrange
      const response = {
        ...testResponse,
        config: {
          ...testResponse.config,
          url: "/user/proven-identity-details",
        },
        data: {
          name: "John Doe",
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
  });

  describe("errorLogger", () => {
    it("should log error with response details with an error response", async () => {
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
      expect(testLogger.error).has.been.calledWith({
        message: {
          description: "API request failed",
          endpoint: "GET /test-path",
          data: { page: "testPage" },
          cri: "testCri",
          duration: 200,
          errorMessage: "test error",
          errorStatus: 500,
        },
      });
    });

    it("should log error with endpoint details with a request error", async () => {
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
