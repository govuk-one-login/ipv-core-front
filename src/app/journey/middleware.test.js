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
  };

  const middleware = proxyquire("./middleware", {
    axios: axiosStub,
    "../../lib/config": configStub,
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

  context("from a sequence of events that ends with a page response", () => {
    const pageType = 'pageTransition';
    const eventResponses = [
      {
        data: { redirect: { event: "next" } }
      },
      {
        data: { redirect: { event: "startCri" } }
      },
      {
        data: { page: { type: pageType } }
      }
    ];

    const callBack = sinon.stub();
    axiosStub.post = callBack;

    eventResponses.forEach((er, index) => {
      callBack.onCall(index).returns(eventResponses[index]);
    });

    beforeEach(() => {
      req = {
        baseURL: "/next",
        session: { ipvSessionId: "ipv-session-id" },
      };
    });

    it("should redirect to journey transition page with message in query string", async function() {
      await middleware.updateJourneyState(req, res, next);
      expect(res.redirect).to.have.been.calledWith(`/journey/journeyPage?pageId=${pageType}`);
    });

    it("should have called the network in the correct sequence", async function() {
      await middleware.updateJourneyState(req, res, next);
      expect(axiosStub.post.getCall(0)).to.have.been.calledWith(`${configStub.API_BASE_URL}/journey/next`);
      expect(axiosStub.post.getCall(1)).to.have.been.calledWith(`${configStub.API_BASE_URL}/journey/next`);
      expect(axiosStub.post.getCall(2)).to.have.been.calledWith(`${configStub.API_BASE_URL}/journey/startCri`);
    });
  });

  context('calling the journeyPage endpoint', () => {
    beforeEach(() => {
      req = {
        baseURL: "/journey/journeyPage",
        session: { ipvSessionId: "ipv-session-id" },
      };
    });

    it("should render generic transition page when given a valid pageId", async () => {
      req = {
        query: { pageId: 'transition' },
      };

      await middleware.handleJourneyPage(req, res);
      expect(res.render).to.have.been.calledWith("journey/transition");
    });

    it("should render default case when given valid pageId", async () => {
      req = {
        query: { pageId: 'page-cri-start' },
      };

      await middleware.handleJourneyPage(req, res);
      expect(res.render).to.have.been.calledWith("journey/page-cri-start");
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
          data: { redirect: { cri: { id: 'someid', authorizeUrl: authorizeUrl, request: '' } } }
        },
      ];
      req = {
        baseURL: "/next",
        session: { ipvSessionId: "ipv-session-id" },
      };

      const callBack = sinon.stub();
      axiosStub.post = callBack;

      eventResponses.forEach((er, index) => {
        callBack.onCall(index).returns(eventResponses[index]);
      });
    });

    it("should be redirected to the url supplied from authorizeUrl", async function() {
      await middleware.updateJourneyState(req, res, next);
      expect(res.redirect).to.have.been.calledWith(authorizeUrl);
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
});
