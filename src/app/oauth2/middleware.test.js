const proxyquire = require("proxyquire");
const { describe, beforeEach } = require("mocha");
const { expect, sinon } = require("./../../../test/mocha-utils");

const axiosStub = {};
const middleware = proxyquire("./middleware", {
  axios: axiosStub,
});

describe("oauth middleware", () => {
  describe("addAuthParamsToSession", () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
      req = {
        query: {
          response_type: "code",
          client_id: "s6BhdRkqt3",
          state: "xyz",
          redirect_uri: "https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb",
          unusedParam: "not used",
        },
        session: {},
      };

      res = {};

      next = sinon.fake();
    });

    it("should save authParams to session", async function () {
      await middleware.addAuthParamsToSession(req, res, next);

      expect(req.session.authParams).to.deep.equal({
        response_type: req.query.response_type,
        client_id: req.query.client_id,
        state: req.query.state,
        redirect_uri: req.query.redirect_uri,
      });
    });

    it("should call next", async function () {
      await middleware.addAuthParamsToSession(req, res, next);

      expect(next).to.have.been.called;
    });
  });

  describe("renderOauthPage", () => {
    let req;
    let res;

    it("should render index page", () => {
      res = { render: sinon.fake() };

      middleware.renderOauthPage(req, res);

      expect(res.render).to.have.been.calledWith("index-hmpo");
    });
  });

  describe("validatePOST", () => {
    let req;
    let res;
    beforeEach(() => {
      req = {
        session: {
          authParams: {
            response_type: "code",
            client_id: "s6BhdRkqt3",
            state: "xyz",
            redirect_uri: "https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb",
            scope: "openid",
          },
        },
      };
    });

    it("should successfully redirects when code is valid", async function () {
      const code = "test_code";

      axiosStub.get = sinon.fake.returns({
        data: { code: { value: code } },
      });

      res = { redirect: sinon.fake() };

      await middleware.validatePOST(req, res);

      expect(res.redirect).to.have.been.calledWith(
        `https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb?code=${code}`
      );
    });

    context("with missing authorization code", () => {
      beforeEach(() => {
        axiosStub.get = sinon.fake.returns({
          data: { code: { value: undefined } },
        });
        res = {
          status: sinon.fake.returns({ send: () => ({}) }),
          redirect: sinon.fake(),
        };
      });

      it("should send a 500 error when code is missing", async function () {
        await middleware.validatePOST(req, res);

        expect(res.status).to.have.been.calledWith(500);
      });

      it("should not redirect when code is missing", async function () {
        await middleware.validatePOST(req, res);

        expect(res.redirect).to.not.have.been.called;
      });
    });
  });
});
