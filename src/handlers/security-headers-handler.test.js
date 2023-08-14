const { expect } = require("chai");
const sinon = require("sinon");

const {
  securityHeadersHandler,
} = require("../../src/handlers/security-headers-handler");

describe("Security headers handler", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      session: {},
      log: { info: sinon.fake(), error: sinon.fake() },
    };

    res = {
      set: sinon.fake(),
      removeHeader: sinon.fake(),
    };

    next = sinon.fake();
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should add security headers to response", () => {
    securityHeadersHandler(req, res, next);
    expect(res.set).to.be.have.been.calledOnce;
    expect(res.set).to.be.have.been.calledWith({
      "Strict-Transport-Security": "max-age=31536000",
      "Content-Security-Policy": "default-src 'self';",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "0",
      "X-Content-Type-Options": "nosniff",
    });
    expect(next).to.be.have.been.calledOnce;
  });

  it("should remove express powered by header from response", () => {
    securityHeadersHandler(req, res, next);
    expect(res.removeHeader).to.be.have.been.calledOnce;
    expect(res.removeHeader).to.be.have.been.calledWith("X-Powered-By");
    expect(next).to.be.have.been.calledOnce;
  });
});
