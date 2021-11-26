const proxyquire = require("proxyquire");

describe("credential issuer middleware", () => {
  describe("redirectToAuthorize", () => {
    let req;
    let res;
    let configStub;

    beforeEach(() => {
      req = {};
      res = { redirect: sinon.fake(), send: sinon.fake() };
      configStub = {};
    });
    it("should successfully be redirected", async function () {
      configStub.CREDENTIAL_ISSUER_BASE_URL = "http://example.com";

      const {redirectToAuthorize} = proxyquire("./middleware", {
        "../../lib/config": configStub,
      });

      await redirectToAuthorize(req, res);

      expect(res.redirect).to.have.been.calledWith(
        `http://example.com/authorize`
      );
    });

    context("with an empty base url", () => {
      beforeEach(() => {
        configStub.CREDENTIAL_ISSUER_BASE_URL = "";
      });

      it("should send 500 error", async () => {
        const {redirectToAuthorize} = proxyquire("./middleware", {
          "../../lib/config": configStub,
        });

        await redirectToAuthorize(req, res);

        expect(res.send).to.have.been.calledWith(500);
      });
      it("should not call redirect", async () => {
        const {redirectToAuthorize} = proxyquire("./middleware", {
          "../../lib/config": configStub,
        });

        await redirectToAuthorize(req, res);

        expect(res.redirect).not.to.have.been.called;
      });
    });
  });

  describe("addCallbackParamsToSession", () => {
    let req;
    let res;
    let next;
    let configStub;

    beforeEach(() => {
      req = {
        query: {
          response_type: "code",
          client_id: "s6BhdRkqt3",
          state: "xyz",
          authorization_code: 1234,
          unusedParam: "not used",
        },
        session: {},
      };
      configStub = {};
      next = sinon.fake();
    });

    it("should save callbackParams to session", async function () {
      const {addCallbackParamsToSession} = proxyquire("./middleware", {
        "../../lib/config": configStub,
      });
      await addCallbackParamsToSession(req, res, next);

      expect(req.session.callbackParams).to.deep.equal({
        response_type: req.query.response_type,
        client_id: req.query.client_id,
        state: req.query.state,
        authorization_code: req.query.authorization_code,
      });
    });

    it("should call next", async function () {
      const {addCallbackParamsToSession} = proxyquire("./middleware", {
        "../../lib/config": configStub,
      });

      await addCallbackParamsToSession(req, res, next);

      expect(next).to.have.been.called;
    });
  });

  describe("renderDebugPage", () => {
    let req;
    let res;
    let configStub;

    beforeEach(() => {
      res = {
        render: sinon.fake(),
      };
      configStub = {};
    });

    it("should render index page", () => {
      const {renderDebugPage} = proxyquire("./middleware", {
        "../../lib/config": configStub,
      });

      renderDebugPage(req, res);

      expect(res.render).to.have.been.calledWith("index");
    });
  });
});
