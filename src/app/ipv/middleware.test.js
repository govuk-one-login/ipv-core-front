const proxyquire = require("proxyquire");
const { expect } = require("chai");
const sinon = require("sinon");

describe("journey middleware", () => {
  let req;
  let res;
  let next;

  const axiosStub = {};
  const configStub = {
    API_BASE_URL: "https://example.org/subpath",
    API_SHARED_ATTRIBUTES_JWT_PATH: '/jwtPath',
    EXTERNAL_WEBSITE_HOST: "https://callbackaddres.org"
  };

  const sharedAttributeHelper = proxyquire("../shared/sharedAttributeHelper", {
    axios: axiosStub,
    "../../lib/config": configStub,
  });

  const sharedCriHelper = proxyquire("../shared/criHelper", {
    axios: axiosStub,
    "../../lib/config": configStub,
  });

  const middleware = proxyquire("./middleware", {
    axios: axiosStub,
    "../../lib/config": configStub,
    "../shared/sharedAttributeHelper": sharedAttributeHelper,
    "../shared/../shared/criHelper": sharedCriHelper,
  });

  beforeEach(() => {
    res = {
      status: sinon.fake(),
      redirect: sinon.fake(),
      send: sinon.fake(),
      render: sinon.fake()
    };
    req = {
      session: { ipvSessionId: "ipv-session-id" },
    }
    next = sinon.fake();
  });

  context("request to updateJourneyState not in allowedList ", () => {

    beforeEach(() => {
      req = {
        url: "/foo",
        session: { ipvSessionId: "ipv-session-id" },
      };
    });

    it("should call next with error message", async function() {
      await middleware.updateJourneyState(req, res, next);
      expect(next).to.have.been.calledWith(sinon.match.has('message', 'Action /foo not valid'));
    });


  });

  context("from a sequence of events that ends with a page response", () => {
    const pageType = 'pageTransition';
    const eventResponses = [
      {
        data: { journey: "journey/next"  }
      },
      {
        data: { journey: "journey/startCri" }
      },
      {
        data: { page:  pageType }
      }
    ];

    const callBack = sinon.stub();
    axiosStub.post = callBack;

    eventResponses.forEach((er, index) => {
      callBack.onCall(index).returns(eventResponses[index]);
    });

    const headers = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'ipv-session-id': 'ipv-session-id'
      }
    }

    beforeEach(() => {
      req = {
        url: "/journey/next",
        session: { ipvSessionId: "ipv-session-id" },
      };
    });

    it("should redirect to journey transition page with message in query string", async function() {
      await middleware.updateJourneyState(req, res, next);
      expect(res.redirect).to.have.been.calledWith(`/ipv/journeyPage?pageId=${pageType}`);
    });

    it("should have called the network in the correct sequence", async function() {
      await middleware.updateJourneyState(req, res, next);
      expect(axiosStub.post.getCall(0)).to.have.been.calledWith(`${configStub.API_BASE_URL}/journey/next`, {}, headers);
      expect(axiosStub.post.getCall(1)).to.have.been.calledWith(`${configStub.API_BASE_URL}/journey/next`, {}, headers);
      expect(axiosStub.post.getCall(2)).to.have.been.calledWith(`${configStub.API_BASE_URL}/journey/startCri`, {}, headers);
    });
  });

  context('calling the journeyPage endpoint', () => {
    beforeEach(() => {
      req = {
        url: "/ipv/journeyPage",
        session: { ipvSessionId: "ipv-session-id" },
      };
    });

    it("should render generic transition page when given a valid pageId", async () => {
      req = {
        query: { pageId: 'page-transition-default' },
      };

      await middleware.handleJourneyPage(req, res);
      expect(res.render).to.have.been.calledWith("ipv/page-transition-default");
    });

    it("should render default case when given valid pageId", async () => {
      req = {
        query: { pageId: 'page-cri-start' },
      };

      await middleware.handleJourneyPage(req, res);
      expect(res.render).to.have.been.calledWith("ipv/page-cri-start");
    });

    it("should raise an error when missing pageId", async () => {
      await middleware.handleJourneyPage(req, res, next);
      expect(res.status).to.have.been.calledWith(500);
    });
  });

  context("handling CRI event response", () => {
    const authorizeUrl = 'https://someurl.com';
    let eventResponses = [];

    beforeEach(() => {
      eventResponses = [
        {
          data: {
            cri: { id: 'someid', authorizeUrl: authorizeUrl, request: 'req', ipvClientId: "clientId" }
          }
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

      const getStub = sinon.stub();
      getStub.withArgs(`${configStub.API_BASE_URL}${configStub.API_SHARED_ATTRIBUTES_JWT_PATH}`,
        {
          headers : {"ipv-session-id": req.session.ipvSessionId}
        })
        .returns({data: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJkYXRlT2ZCaXJ0aHMiOltdLCJhZGRyZXNzZXMiOltdLCJuYW1lcyI6W10sImFkZHJlc3NIaXN0b3J5IjpbXX0.DwQQOldmOYQ1Lv6OJETzks7xv1fM7VzW0O01H3-uQqQ_rSkCZrd2KwQHHzo0Ddw2K_LreePy-tEr-tiPgi8Yl604n3rwQy6xBat8mb4lTtNnOxsUOYviYQxC5aamsvBAS27G43wFejearXHWzEqhJhIFdGE4zJkgZAKpLGzvOXLvX4NZM4aI4c6jMgpktkvvFey-O0rI5ePh5RU4BjbG_hvByKNlLr7pzIlsS-Q8KuIPawqFJxN2e3xfj1Ogr8zO0hOeDCA5dLDie78sPd8ph0l5LOOcGZskd-WD74TM6XeinVpyTfN7esYBnIZL-p-qULr9CUVIPCMxn-8VTj3SOw=='})
      axiosStub.get = getStub;
    });

    it("should be redirected to a valid redirectURL", async function() {
      await middleware.updateJourneyState(req, res, next);
      expect(req.redirectURL.toString()).to.equal("https://someurl.com/?response_type=code&client_id=clientId&state=test-state&redirect_uri=https%3A%2F%2Fcallbackaddres.org%2Fcredential-issuer%2Fcallback%3Fid%3Dsomeid&request=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJkYXRlT2ZCaXJ0aHMiOltdLCJhZGRyZXNzZXMiOltdLCJuYW1lcyI6W10sImFkZHJlc3NIaXN0b3J5IjpbXX0.DwQQOldmOYQ1Lv6OJETzks7xv1fM7VzW0O01H3-uQqQ_rSkCZrd2KwQHHzo0Ddw2K_LreePy-tEr-tiPgi8Yl604n3rwQy6xBat8mb4lTtNnOxsUOYviYQxC5aamsvBAS27G43wFejearXHWzEqhJhIFdGE4zJkgZAKpLGzvOXLvX4NZM4aI4c6jMgpktkvvFey-O0rI5ePh5RU4BjbG_hvByKNlLr7pzIlsS-Q8KuIPawqFJxN2e3xfj1Ogr8zO0hOeDCA5dLDie78sPd8ph0l5LOOcGZskd-WD74TM6XeinVpyTfN7esYBnIZL-p-qULr9CUVIPCMxn-8VTj3SOw%3D%3D");
    });

    it("should be redirected to a valid redirectURL when given specific cri id", async function() {
      eventResponses = [
        {
          data: { redirect: { cri: { id: 'PassportIssuer', authorizeUrl: authorizeUrl, request: 'req', ipvClientId: "clientId" } } }
        },
      ];
      req = {
        url: "/journey/cri/start/ukPassport",
        session: { ipvSessionId: "ipv-session-id" },
      };
      await middleware.updateJourneyState(req, res, next);
      expect(req.redirectURL.toString()).to.equal("https://someurl.com/?response_type=code&client_id=clientId&state=test-state&redirect_uri=https%3A%2F%2Fcallbackaddres.org%2Fcredential-issuer%2Fcallback%3Fid%3Dsomeid&request=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJkYXRlT2ZCaXJ0aHMiOltdLCJhZGRyZXNzZXMiOltdLCJuYW1lcyI6W10sImFkZHJlc3NIaXN0b3J5IjpbXX0.DwQQOldmOYQ1Lv6OJETzks7xv1fM7VzW0O01H3-uQqQ_rSkCZrd2KwQHHzo0Ddw2K_LreePy-tEr-tiPgi8Yl604n3rwQy6xBat8mb4lTtNnOxsUOYviYQxC5aamsvBAS27G43wFejearXHWzEqhJhIFdGE4zJkgZAKpLGzvOXLvX4NZM4aI4c6jMgpktkvvFey-O0rI5ePh5RU4BjbG_hvByKNlLr7pzIlsS-Q8KuIPawqFJxN2e3xfj1Ogr8zO0hOeDCA5dLDie78sPd8ph0l5LOOcGZskd-WD74TM6XeinVpyTfN7esYBnIZL-p-qULr9CUVIPCMxn-8VTj3SOw%3D%3D");
    });

    it("should raise an error when missing authorizeUrl", async () => {
      beforeEach(() => {
        eventResponses = [
          {
            data: { redirect: { cri: { id: 'someid', authorizeUrl: '', request: '' } } }
          },
        ];

        const callBack = sinon.stub();
        axiosStub.post = callBack;

        eventResponses.forEach((er, index) => {
          callBack.onCall(index).returns(eventResponses[index]);
        });


      });

      await middleware.handleJourneyPage(req, res, next);
      expect(res.status).to.have.been.calledWith(500);
    });
  });

  context("handling Client event response", () => {
    let eventResponses = [];

    const redirectUrl = 'https://someurl.org';
    const authCode = 'ABC123'
    beforeEach(() => {
      eventResponses = [
        {
          data: { client: { redirectUrl: redirectUrl , authCode: authCode } }
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

    it("should be redirected to a valid Client URL with Authcode", async function() {
      await middleware.updateJourneyState(req, res, next);
      expect(res.redirect).to.be.calledWith(`${redirectUrl}?code=${authCode}`);
  });
});

  context("handling missing callBackUrl Client event response", () => {
    let eventResponses = [];

    const authCode = 'ABC123'

    beforeEach(() => {
      eventResponses = [
        {
          data: { client: { callBackUrl: null , authCode: authCode} }
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

    it("should call next with error message Redirect url is missing", async function() {
      await middleware.updateJourneyState(req, res, next);
      expect(next).to.have.been.calledWith(sinon.match.has('message', 'Client Response Redirect url is missing'));
    });
  });

  context("handling missing authCode Client event response", () => {
    let eventResponses = [];

    const redirectUrl = 'https://someurl.org';
    beforeEach(() => {
      eventResponses = [
        {
          data: { client: { redirectUrl , authCode: null} }
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

    it("should call next with error message authCode is missing", async function() {
      await middleware.updateJourneyState(req, res, next);
      expect(next).to.have.been.calledWith(sinon.match.has('message', 'Client Response Authcode is missing is missing'));
    });
  });
})
