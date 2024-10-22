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

beforeEach(() => {
  sinon.useFakeTimers(300);
  testLogger.info.resetHistory();
  testLogger.error.resetHistory();
});

afterEach(() => {
  sinon.restore();
});

describe("axiosHelper", () => {
  describe("responseLogger", () => {
    it("should log response details", async () => {
      await axiosResponseLogger(testResponse);

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
      const response = {
        ...testResponse,
        data: {
          cri: {
            id: "testCri",
            redirectUrl: "https://cri?sensitive=param",
          },
        },
      };

      await axiosResponseLogger(response);

      expect(testLogger.info).has.been.calledWith({
        message: {
          description: "API request completed",
          endpoint: "GET /test-path",
          data: {
            cri: {
              id: "testCri",
              redirectUrl: "<cri redirect>",
            },
          },
          cri: "testCri",
          duration: 200,
        },
      });
    });

    it("should not log client redirect details", async () => {
      const response = {
        ...testResponse,
        data: {
          client: {
            redirectUrl: "https://client?sensitive=param",
          },
        },
      };

      await axiosResponseLogger(response);

      expect(testLogger.info).has.been.calledWith({
        message: {
          description: "API request completed",
          endpoint: "GET /test-path",
          data: {
            client: {
              redirectUrl: "<client redirect>",
            },
          },
          cri: "testCri",
          duration: 200,
        },
      });
    });
  });

  describe("errorLogger", () => {
    it("should log error with response details with an error response", async () => {
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

      await expect(axiosErrorLogger(error)).to.be.rejectedWith(error);

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
      const error = new AxiosError(
        "test error",
        "ERR",
        testRequest as any,
        testRequest,
      );

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
      const error = new AxiosError("test error", "ERR", testRequest as any);

      await expect(axiosErrorLogger(error)).to.be.rejectedWith(error);

      expect(testLogger.error).has.been.calledWith({
        message: {
          description: "Something went wrong setting up an API request",
          errorMessage: "test error",
        },
      });
    });

    it("should pass on any non-axios error", async () => {
      const error = new Error("test error");

      await expect(axiosErrorLogger(error)).to.be.rejectedWith(error);

      expect(testLogger.error).to.have.not.been.called;
    });
  });
});
