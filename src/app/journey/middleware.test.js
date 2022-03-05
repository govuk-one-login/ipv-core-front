const proxyquire = require("proxyquire");
const { expect } = require("chai");
const sinon = require("sinon");

describe("journey", () => {
  let req;
  let res;
  let next;

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

  context("From a sequence of events that ends with a page response", () => {

    const eventResponses = [
      {
        data: { redirect: { event: "/next" } }
      },
      {
        data: { redirect: { event: "/startCri" } }
      },
      {
        data: { page: { type: "/journeyTransition" } }
      }
    ];

    let axiosStub = {};
    const configStub = {
      API_BASE_URL: "https://example.org/subpath",
    };

    const middleware = proxyquire("./middleware", {
      axios: axiosStub,
      "../../lib/config": configStub,
    });

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

    it("should redirect to journey transition page", async function() {
      await middleware.updateJourneyState(req, res, next);
      expect(res.redirect).to.have.been.calledWith("/journeyTransition");
    });

    it("should have called the network in the correct sequence", async function() {
      await middleware.updateJourneyState(req, res, next);
      expect(axiosStub.post.getCall(0)).to.have.been.calledWith(`${configStub.API_BASE_URL}/journey/next`);
      expect(axiosStub.post.getCall(1)).to.have.been.calledWith(`${configStub.API_BASE_URL}/journey/next`);
      expect(axiosStub.post.getCall(2)).to.have.been.calledWith(`${configStub.API_BASE_URL}/journey/startCri`);
    });
  });
});
