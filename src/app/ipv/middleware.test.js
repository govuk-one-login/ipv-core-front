const proxyquire = require("proxyquire");
const { expect } = require("chai");
const sinon = require("sinon");

describe("journey middleware", () => {
  let req;
  let res;
  let next;

  const axiosStub = { post: sinon.stub() };
  const configStub = {
    API_BASE_URL: "https://example.org/subpath",
    EXTERNAL_WEBSITE_HOST: "https://callbackaddres.org",
  };

  const sharedCriHelper = proxyquire("../shared/criHelper", {
    axios: axiosStub,
    "../../lib/config": configStub,
  });

  const middleware = proxyquire("./middleware", {
    axios: axiosStub,
    "../../lib/config": configStub,
    "../shared/../shared/criHelper": sharedCriHelper,
  });

  beforeEach(() => {
    res = {
      status: sinon.fake(),
      redirect: sinon.fake(),
      send: sinon.fake(),
      render: sinon.fake(),
    };
    req = {
      session: { ipvSessionId: "ipv-session-id" },
      csrfToken: sinon.fake(),
    };
    next = sinon.fake();
    axiosStub.post.reset();
  });

  context("from a sequence of events that ends with a page response", () => {
    it("should have called the network in the correct sequence", async function () {
      const pageId = "pageTransition";
      const eventResponses = [
        {
          data: { journey: "journey/next" },
        },
        {
          data: { journey: "journey/startCri" },
        },
        {
          data: { page: pageId },
        },
      ];

      const callBack = sinon.stub();
      axiosStub.post = callBack;

      eventResponses.forEach((er, index) => {
        callBack.onCall(index).returns(eventResponses[index]);
      });

      const headers = {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "ipv-session-id": "ipv-session-id",
        },
      };

      beforeEach(() => {
        req = {
          session: { ipvSessionId: "ipv-session-id" },
        };
      });

      await middleware.handleJourneyResponse(req, res, "/journey/next");
      expect(axiosStub.post.getCall(0)).to.have.been.calledWith(
        `${configStub.API_BASE_URL}/journey/next`,
        {},
        headers
      );
      expect(axiosStub.post.getCall(1)).to.have.been.calledWith(
        `${configStub.API_BASE_URL}/journey/next`,
        {},
        headers
      );
      expect(axiosStub.post.getCall(2)).to.have.been.calledWith(
        `${configStub.API_BASE_URL}/journey/startCri`,
        {},
        headers
      );

      expect(res.redirect).to.have.been.calledWith(`/ipv/page/${pageId}`);
    });
  });

  context("calling the journeyPage endpoint", () => {
    beforeEach(() => {
      req = {
        url: "/ipv/page",
        session: { ipvSessionId: "ipv-session-id" },
      };
    });

    it("should render debug page when page-ipv-debug", async () => {
      req = {
        params: { pageId: "page-ipv-debug" },
        csrfToken: sinon.fake(),
        session: { currentPage: "page-ipv-debug" },
      };

      await middleware.handleJourneyPage(req, res);
      expect(res.redirect).to.have.been.calledWith("/debug");
    });

    it("should render page case when given valid pageId", async () => {
      req = {
        params: { pageId: "page-ipv-identity-start" },
        csrfToken: sinon.fake(),
        session: { currentPage: "page-ipv-identity-start" },
      };

      await middleware.handleJourneyPage(req, res);
      expect(res.render).to.have.been.calledWith("ipv/page-ipv-identity-start");
    });

    it("should render technical error page when given invalid pageId", async () => {
      req = {
        params: { pageId: "../debug/page-ipv-debug" },
        session: { currentPage: "../debug/page-ipv-debug" },
      };

      await middleware.handleJourneyPage(req, res);
      expect(res.render).to.have.been.calledWith("ipv/pyi-technical");
    });

    it("should render unrecoverable technical error page when current page is not equal to pageId", async () => {
      req = {
        params: { pageId: "invalid-page-id" },
        session: { currentPage: "../debug/page-ipv-debug" },
      };

      await middleware.handleJourneyPage(req, res);
      expect(res.redirect).to.have.been.calledWith(
        "pyi-technical-unrecoverable"
      );
    });

    it("should raise an error when missing pageId", async () => {
      await middleware.handleJourneyPage(req, res, next);
      expect(res.status).to.have.been.calledWith(500);
    });
  });

  context("calling the updateJourneyState", () => {
    it("should raise an error when debug is set to false", async () => {
      req.session.isDebugJourney = false;
      await middleware.updateJourneyState(req, res, next);
      expect(next).to.have.been.calledWith(
        sinon.match.has("message", "Debug operation not available")
      );
    });

    it("should raise an error when given an invalid action", async () => {
      req.session.isDebugJourney = true;
      req.url = "/invalidCri";
      await middleware.updateJourneyState(req, res, next);
      expect(next).to.have.been.calledWith(
        sinon.match.has("message", "Action /invalidCri not valid")
      );
    });
  });

  context("handling CRI event response", async () => {
    const redirectUrl = "https://someurl.com";
    let eventResponses = [];
    let clientId = "test-client-id";
    let request =
      "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJkYXRlT2ZCaXJ0aHMiOltdLCJhZGRyZXNzZXMiOltdLCJuYW1lcyI6W10sImFkZHJlc3NIaXN0b3J5IjpbXX0.DwQQOldmOYQ1Lv6OJETzks7xv1fM7VzW0O01H3-uQqQ_rSkCZrd2KwQHHzo0Ddw2K_LreePy-tEr-tiPgi8Yl604n3rwQy6xBat8mb4lTtNnOxsUOYviYQxC5aamsvBAS27G43wFejearXHWzEqhJhIFdGE4zJkgZAKpLGzvOXLvX4NZM4aI4c6jMgpktkvvFey-O0rI5ePh5RU4BjbG_hvByKNlLr7pzIlsS-Q8KuIPawqFJxN2e3xfj1Ogr8zO0hOeDCA5dLDie78sPd8ph0l5LOOcGZskd-WD74TM6XeinVpyTfN7esYBnIZL-p-qULr9CUVIPCMxn-8VTj3SOw==";
    let responseType = "code";

    beforeEach(() => {
      eventResponses = [
        {
          data: {
            cri: {
              id: "someid",
              redirectUrl: `${redirectUrl}?client_id=${clientId}&request=${request}&response_type=${responseType}`,
            },
          },
        },
      ];
      req = {
        url: "/journey/next",
        session: { ipvSessionId: "ipv-session-id" },
      };

      const callBack = sinon.stub();
      axiosStub.post = callBack;

      eventResponses.forEach((er, index) => {
        callBack.onCall(index).returns(eventResponses[index]);
      });
    });

    afterEach(() => {
      sinon.restore();
    });

    it("should be redirected to a valid redirectURL", async function () {
      await middleware.handleJourneyResponse(req, res, "/journey/next");
      expect(req.redirectURL.toString()).to.equal(
        "https://someurl.com/?client_id=test-client-id&request=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJkYXRlT2ZCaXJ0aHMiOltdLCJhZGRyZXNzZXMiOltdLCJuYW1lcyI6W10sImFkZHJlc3NIaXN0b3J5IjpbXX0.DwQQOldmOYQ1Lv6OJETzks7xv1fM7VzW0O01H3-uQqQ_rSkCZrd2KwQHHzo0Ddw2K_LreePy-tEr-tiPgi8Yl604n3rwQy6xBat8mb4lTtNnOxsUOYviYQxC5aamsvBAS27G43wFejearXHWzEqhJhIFdGE4zJkgZAKpLGzvOXLvX4NZM4aI4c6jMgpktkvvFey-O0rI5ePh5RU4BjbG_hvByKNlLr7pzIlsS-Q8KuIPawqFJxN2e3xfj1Ogr8zO0hOeDCA5dLDie78sPd8ph0l5LOOcGZskd-WD74TM6XeinVpyTfN7esYBnIZL-p-qULr9CUVIPCMxn-8VTj3SOw==&response_type=code"
      );
    });

    it("should be redirected to a valid redirectURL when given specific cri id", async function () {
      eventResponses = [
        {
          data: {
            redirect: {
              cri: {
                id: "PassportIssuer",
                redirectUrl: `${redirectUrl}?client_id=${clientId}&request=${request}&response_type=${responseType}`,
              },
            },
          },
        },
      ];
      req = {
        session: { ipvSessionId: "ipv-session-id" },
      };
      await middleware.handleJourneyResponse(
        req,
        res,
        "/journey/cri/start/ukPassport"
      );
      expect(req.redirectURL.toString()).to.equal(
        "https://someurl.com/?client_id=test-client-id&request=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJkYXRlT2ZCaXJ0aHMiOltdLCJhZGRyZXNzZXMiOltdLCJuYW1lcyI6W10sImFkZHJlc3NIaXN0b3J5IjpbXX0.DwQQOldmOYQ1Lv6OJETzks7xv1fM7VzW0O01H3-uQqQ_rSkCZrd2KwQHHzo0Ddw2K_LreePy-tEr-tiPgi8Yl604n3rwQy6xBat8mb4lTtNnOxsUOYviYQxC5aamsvBAS27G43wFejearXHWzEqhJhIFdGE4zJkgZAKpLGzvOXLvX4NZM4aI4c6jMgpktkvvFey-O0rI5ePh5RU4BjbG_hvByKNlLr7pzIlsS-Q8KuIPawqFJxN2e3xfj1Ogr8zO0hOeDCA5dLDie78sPd8ph0l5LOOcGZskd-WD74TM6XeinVpyTfN7esYBnIZL-p-qULr9CUVIPCMxn-8VTj3SOw==&response_type=code"
      );
    });
  });

  context(
    "handling CRI event response that has missing redirectUrl",
    async () => {
      let eventResponses = [];

      beforeEach(() => {
        eventResponses = [
          {
            data: {
              cri: {
                id: "someid3",
                redirectUrl: "",
              },
            },
          },
        ];
        req = {
          session: { ipvSessionId: "ipv-session-id" },
        };

        const callBack = sinon.stub();
        axiosStub.post = callBack;

        eventResponses.forEach((er, index) => {
          callBack.onCall(index).returns(eventResponses[index]);
        });
      });

      it("should raise an error ", async () => {
        await middleware.handleJourneyAction(req, res, next);
        expect(next).to.have.been.calledWith(
          sinon.match.has("message", "CRI response RedirectUrl is missing")
        );
      });
    }
  );

  context("handling Client event response", () => {
    const redirectUrl = "https://someurl.org";

    const callBack = sinon.stub();

    beforeEach(() => {
      axiosStub.post = callBack;

      callBack.onCall(0).returns({
        data: { client: { redirectUrl: redirectUrl } },
      });

      req = {
        session: { ipvSessionId: "ipv-session-id" },
      };
    });

    it("should be redirected to a valid Client URL", async function () {
      await middleware.handleJourneyResponse(req, res, "/journey/next");
      expect(res.redirect).to.be.calledWith(`${redirectUrl}`);
    });
  });

  context("handling missing callBackUrl Client event response", () => {
    let eventResponses = [];

    const authCode = "ABC123";
    const state = "test-state";

    beforeEach(() => {
      eventResponses = [
        {
          data: {
            client: { redirectUrl: null, authCode: authCode, state: state },
          },
        },
      ];

      req = {
        url: "/journey/next",
        session: { ipvSessionId: "ipv-session-id" },
      };

      const callBack = sinon.stub();
      axiosStub.post = callBack;

      eventResponses.forEach((er, index) => {
        callBack.onCall(index).returns(eventResponses[index]);
      });
    });

    it("should call next with error message Redirect url is missing", async function () {
      await middleware.handleJourneyAction(req, res, next);
      expect(next).to.have.been.calledWith(
        sinon.match.has("message", "Client Response redirect url is missing")
      );
    });
  });

  context(
    "handling different journey actions being passed into the request",
    () => {
      it("should post with journey/end", async function () {
        req = {
          body: { journey: "end" },
          session: { ipvSessionId: "ipv-session-id" },
        };

        await middleware.handleJourneyAction(req, res, next);
        expect(axiosStub.post.firstCall).to.have.been.calledWith(
          `${configStub.API_BASE_URL}/journey/end`
        );
      });

      it("should post with journey/next by default", async function () {
        await middleware.handleJourneyAction(req, res, next);
        expect(axiosStub.post.firstCall).to.have.been.calledWith(
          `${configStub.API_BASE_URL}/journey/next`
        );
      });
    }
  );
});
