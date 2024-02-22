const sinon = require("sinon");
const { expect } = require("chai");
const proxyquire = require("proxyquire");

describe("axios Helper", () => {
  let axiosErrorHandler;
  let axiosStub;
  beforeEach(() => {
    axiosStub = {
      isAxiosError: sinon.stub().returns(true),
    };

    axiosErrorHandler = proxyquire("./axiosHelper", {
      axios: axiosStub,
      axiosErrorHandler: {},
    }).axiosErrorHandler;
  });

  it("Should log Core Back error if axios error response received", () => {
    const axiosCoreBackError = {
      message: "500 error from endpoint",
      response: {
        data: "dummyData",
      },
      request: {
        method: "POST",
        path: "/dummyApi",
      },
      config: {
        logger: {
          error: sinon.stub(),
        },
      },
    };

    axiosErrorHandler(axiosCoreBackError);

    expect(axiosCoreBackError.config.logger.error).to.be.calledOnceWith({
      message: {
        description: "Error response received from API",
        errorMessage: "500 error from endpoint",
        data: "dummyData",
        endpoint: "POST /dummyApi",
      },
      level: "ERROR",
    });
  });

  it("Should log credentialIssuerId if axios error response received", () => {
    const axiosCoreBackError = {
      message: "500 error from endpoint",
      request: {
        method: "POST",
        path: "/dummyApi",
      },
      response: {
        data: "Test data",
        config: {
          data: '{"authorizationCode":"dummyAuthCode","credentialIssuerId":"fraud","redirectUri":"dummyRedirectUri","state":"dummyState"}',
        },
      },
      config: {
        logger: {
          error: sinon.stub(),
        },
      },
    };

    axiosErrorHandler(axiosCoreBackError);

    expect(axiosCoreBackError.config.logger.error).to.be.calledOnceWith({
      message: {
        data: "Test data",
        errorMessage: "500 error from endpoint",
        description: "Error response received from API",
        endpoint: "POST /dummyApi",
        cri: "fraud",
      },
      level: "ERROR",
    });
  });

  it("Should log error making request if axios request error received", () => {
    const axiosCoreBackError = {
      request: {
        method: "POST",
        path: "/dummyApi",
      },
      config: {
        logger: {
          error: sinon.stub(),
        },
      },
    };

    axiosErrorHandler(axiosCoreBackError);

    expect(axiosCoreBackError.config.logger.error).to.be.calledOnceWith({
      message: {
        error: axiosCoreBackError,
        description: "Error occurred making request to API",
      },
      level: "ERROR",
    });
  });

  it("Should log whole error if general axios received", () => {
    const error = {
      config: {
        logger: {
          error: sinon.stub(),
        },
      },
    };

    axiosErrorHandler(error);

    expect(error.config.logger.error).to.be.calledOnceWith({
      message: {
        error,
        description: "Something went wrong setting up an API request",
      },
      level: "ERROR",
    });
  });

  it("Should not log if not axios error", () => {
    axiosStub.isAxiosError = sinon.stub().returns(false);

    const error = {
      config: {
        logger: {
          error: sinon.stub(),
        },
      },
    };

    axiosErrorHandler(error);

    expect(error.config.logger.error).to.not.be.called;
  });
});
