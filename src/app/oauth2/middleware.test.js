const proxyquire = require("proxyquire");

const axiosStub = {};
const middleware = proxyquire("./middleware", {
  axios: axiosStub,
});

describe("oauth middleware", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    res = {
      status: sinon.fake(),
      redirect: sinon.fake(),
      send: sinon.fake(),
      render: sinon.fake(),
    };

    next = sinon.fake();
  });

  describe("addAuthParamsToSession", () => {
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
    it("should render index page", () => {
      middleware.renderOauthPage(req, res);

      expect(res.render).to.have.been.calledWith("index-hmpo");
    });
  });

  describe("retrieveAuthorizationCode", () => {
    let axiosResponse;

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

      axiosResponse = {
        data: {
          code: {},
        },
      };

      axiosStub.get = sinon.fake.returns(axiosResponse);
    });

    context("with authorization code", () => {
      beforeEach(() => {
        axiosResponse.data.code.value = "12345";
      });

      it("should set authorization_code on req", async () => {
        await middleware.retrieveAuthorizationCode(req, res, next);

        expect(req.authorization_code).to.eq(axiosResponse.data.code.value);
      });
      it("it should call next", async () => {
        await middleware.retrieveAuthorizationCode(req, res, next);

        expect(next).to.have.been.called;
      });
    });

    context("with missing authorization code", () => {
      beforeEach(() => {
        axiosStub.get = sinon.fake.returns(axiosResponse);
      });

      it("should send a 500 error when code is missing", async function () {
        await middleware.retrieveAuthorizationCode(req, res);

        expect(res.status).to.have.been.calledWith(500);
      });

      it("should not call next", async function () {
        await middleware.retrieveAuthorizationCode(req, res);

        expect(next).to.not.have.been.called;
      });
    });

    context("with axios error", () => {
      let errorMessage;

      beforeEach(() => {
        errorMessage = "server error";

        // axiosStub.get = sinon.fake.throws({ message: errorMessage });
        axiosStub.get = sinon.fake.throws(new Error(errorMessage));
      });

      it("should send call next with error when code is missing", async () => {
        await middleware.retrieveAuthorizationCode(req, res, next);

        expect(next).to.have.been.calledWith(
          sinon.match
            .instanceOf(Error)
            .and(sinon.match.has("message", errorMessage))
        );
      });
    });
  });

  describe("redirectToCallback", () => {
    let axiosResponse;

    beforeEach(() => {
      req = {
        session: {
          authParams: {
            redirect_uri: "https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb",
          },
        },
        authorization_code: "1234",
      };

      axiosResponse = {
        data: {
          code: {},
        },
      };

      axiosStub.get = sinon.fake.returns(axiosResponse);
    });

    it("should successfully redirects when code is valid", async function () {
      await middleware.redirectToCallback(req, res);

      expect(res.redirect).to.have.been.calledWith(
        `https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb?code=1234`
      );
    });
  });
});
