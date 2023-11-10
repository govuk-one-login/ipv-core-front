const proxyquire = require("proxyquire");
const { expect } = require("chai");
const sinon = require("sinon");
const { API_BUILD_PROVEN_USER_IDENTITY_DETAILS } = require("../../lib/config");

describe("journey middleware", () => {
  let req;
  let res;
  let next;

  const axiosStub = { post: sinon.stub(), get: sinon.stub() };

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
      log: { info: sinon.fake(), error: sinon.fake() },
    };
    req = {
      session: {
        ipvSessionId: "ipv-session-id",
        ipAddress: "ip-address",
        featureSet: "feature-set",
      },
      csrfToken: sinon.fake(),
      log: { info: sinon.fake(), error: sinon.fake() },
    };
    next = sinon.fake();
    axiosStub.post = sinon.stub();
    axiosStub.get = sinon.stub();
  });

  context("from a sequence of events that ends with a page response", () => {
    beforeEach(() => {
      req = {
        id: "1",
        session: {
          ipvSessionId: "ipv-session-id",
          ipAddress: "ip-address",
          clientOauthSessionId: "fake-oauth-session-id",
          featureSet: "feature-set",
          save: sinon.fake.yields(null),
        },
        log: { info: sinon.fake(), error: sinon.fake() },
      };
    });

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
          "x-request-id": "1",
          "ip-address": "ip-address",
          "client-session-id": "fake-oauth-session-id",
          "feature-set": "feature-set",
        },
      };

      await middleware.handleJourneyResponse(req, res, "/journey/next");
      expect(axiosStub.post.getCall(0)).to.have.been.calledWith(
        `${configStub.API_BASE_URL}/journey/next`,
        {},
        headers,
      );
      expect(axiosStub.post.getCall(1)).to.have.been.calledWith(
        `${configStub.API_BASE_URL}/journey/next`,
        {},
        headers,
      );
      expect(axiosStub.post.getCall(2)).to.have.been.calledWith(
        `${configStub.API_BASE_URL}/journey/startCri`,
        {},
        headers,
      );

      expect(res.redirect).to.have.been.calledWith(`/ipv/page/${pageId}`);
    });
  });

  context("calling the journeyPage endpoint", () => {
    beforeEach(() => {
      req = {
        id: "1",
        url: "/ipv/page",
        session: { ipvSessionId: "ipv-session-id", ipAddress: "ip-address" },
        log: { info: sinon.fake(), error: sinon.fake() },
      };
    });

    it("should render page case when given valid pageId", async () => {
      req = {
        id: "1",
        params: { pageId: "page-ipv-identity-document-start" },
        csrfToken: sinon.fake(),
        session: { currentPage: "page-ipv-identity-document-start" },
        log: { info: sinon.fake(), error: sinon.fake() },
      };

      await middleware.handleJourneyPage(req, res);
      expect(res.render).to.have.been.calledWith(
        "ipv/page-ipv-identity-document-start.njk",
      );
    });

    it("should render technical error page when given invalid pageId", async () => {
      req = {
        id: "1",
        params: { pageId: "../ipv/page-this-is-invalid" },
        session: { currentPage: "../ipv/page-this-is-invalid" },
        log: { info: sinon.fake(), error: sinon.fake() },
      };

      await middleware.handleJourneyPage(req, res);
      expect(res.render).to.have.been.calledWith("ipv/pyi-technical.njk");
    });

    it("should render unrecoverable timeout error page when given unrecoverable timeout pageId", async () => {
      req = {
        id: "1",
        params: { pageId: "pyi-timeout-unrecoverable" },
        session: { currentPage: "../ipv/page-multiple-doc-check" },
        log: { info: sinon.fake(), error: sinon.fake() },
      };

      await middleware.handleJourneyPage(req, res);
      expect(res.render).to.have.been.calledWith(
        "ipv/pyi-timeout-unrecoverable.njk",
      );
    });

    it("should render attempt recovery error page when current page is not equal to pageId", async () => {
      req = {
        id: "1",
        params: { pageId: "invalid-page-id" },
        session: {
          currentPage: "../ipv/page-multiple-doc-check",
          save: sinon.fake.yields(null),
        },
        log: { info: sinon.fake(), error: sinon.fake() },
      };

      await middleware.handleJourneyPage(req, res);
      expect(res.redirect).to.have.been.calledWith(
        "/ipv/page/pyi-attempt-recovery",
      );
    });

    it("should raise an error when missing pageId", async () => {
      await middleware.handleJourneyPage(req, res, next);
      expect(next).to.have.been.calledWith(sinon.match.instanceOf(Error));
    });

    it("should render pyi-technical-unrecoverable page if ipvSessionId is missing", async () => {
      req = {
        id: "1",
        params: { pageId: "../ipv/page-multiple-doc-check" },
        session: { currentPage: "page-ipv-success", ipvSessionId: null },
        log: { info: sinon.fake(), error: sinon.fake() },
      };

      await middleware.handleJourneyPage(req, res);
      expect(res.render).to.have.been.calledWith(
        "ipv/pyi-technical-unrecoverable.njk",
      );
    });
  });

  context("calling the updateJourneyState", () => {
    it("should raise an error when given an invalid action", async () => {
      req.url = "/invalidCri";
      await middleware.updateJourneyState(req, res, next);
      expect(next).to.have.been.calledWith(
        sinon.match.has("message", "Action /invalidCri not valid"),
      );
    });

    it("should call next with error when issue calling handleJourneyResponse", async () => {
      req.url = "/journey/cri/build-oauth-request/ukPassport";
      const axiosResponse = undefined;
      axiosStub.post = sinon.fake.returns(axiosResponse);

      await middleware.updateJourneyState(req, res, next);
      expect(next).to.have.been.calledWith(sinon.match.instanceOf(Error));
    });

    it("should call handleJourneyResponse when given a valid action", async () => {
      req.url = "/journey/cri/build-oauth-request/ukPassport";
      const axiosResponse = {};
      axiosStub.post = sinon.fake.returns(axiosResponse);

      await middleware.updateJourneyState(req, res, next);
      expect(axiosStub.post.firstCall).to.have.been.calledWith(
        `${configStub.API_BASE_URL}/journey/cri/build-oauth-request/ukPassport`,
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
        id: "1",
        url: "/journey/next",
        session: { ipvSessionId: "ipv-session-id", ipAddress: "ip-address" },
        log: { info: sinon.fake(), error: sinon.fake() },
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
        "https://someurl.com/?client_id=test-client-id&request=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJkYXRlT2ZCaXJ0aHMiOltdLCJhZGRyZXNzZXMiOltdLCJuYW1lcyI6W10sImFkZHJlc3NIaXN0b3J5IjpbXX0.DwQQOldmOYQ1Lv6OJETzks7xv1fM7VzW0O01H3-uQqQ_rSkCZrd2KwQHHzo0Ddw2K_LreePy-tEr-tiPgi8Yl604n3rwQy6xBat8mb4lTtNnOxsUOYviYQxC5aamsvBAS27G43wFejearXHWzEqhJhIFdGE4zJkgZAKpLGzvOXLvX4NZM4aI4c6jMgpktkvvFey-O0rI5ePh5RU4BjbG_hvByKNlLr7pzIlsS-Q8KuIPawqFJxN2e3xfj1Ogr8zO0hOeDCA5dLDie78sPd8ph0l5LOOcGZskd-WD74TM6XeinVpyTfN7esYBnIZL-p-qULr9CUVIPCMxn-8VTj3SOw==&response_type=code",
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
        id: "1",
        session: { ipvSessionId: "ipv-session-id", ipAddress: "ip-address" },
        log: { info: sinon.fake(), error: sinon.fake() },
      };
      await middleware.handleJourneyResponse(
        req,
        res,
        "/journey/cri/start/ukPassport",
      );
      expect(req.redirectURL.toString()).to.equal(
        "https://someurl.com/?client_id=test-client-id&request=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJkYXRlT2ZCaXJ0aHMiOltdLCJhZGRyZXNzZXMiOltdLCJuYW1lcyI6W10sImFkZHJlc3NIaXN0b3J5IjpbXX0.DwQQOldmOYQ1Lv6OJETzks7xv1fM7VzW0O01H3-uQqQ_rSkCZrd2KwQHHzo0Ddw2K_LreePy-tEr-tiPgi8Yl604n3rwQy6xBat8mb4lTtNnOxsUOYviYQxC5aamsvBAS27G43wFejearXHWzEqhJhIFdGE4zJkgZAKpLGzvOXLvX4NZM4aI4c6jMgpktkvvFey-O0rI5ePh5RU4BjbG_hvByKNlLr7pzIlsS-Q8KuIPawqFJxN2e3xfj1Ogr8zO0hOeDCA5dLDie78sPd8ph0l5LOOcGZskd-WD74TM6XeinVpyTfN7esYBnIZL-p-qULr9CUVIPCMxn-8VTj3SOw==&response_type=code",
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
          id: "1",
          session: { ipvSessionId: "ipv-session-id", ipAddress: "ip-address" },
          log: { info: sinon.fake(), error: sinon.fake() },
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
          sinon.match.has("message", "CRI response RedirectUrl is missing"),
        );
      });
    },
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
        id: "1",
        session: { ipvSessionId: "ipv-session-id", ipAddress: "ip-address" },
        log: { info: sinon.fake(), error: sinon.fake() },
      };
    });

    it("should be redirected to a valid Client URL", async function () {
      req.session.clientOauthSessionId = "fake-client-session";
      await middleware.handleJourneyResponse(req, res, "/journey/next");
      expect(res.redirect).to.be.calledWith(`${redirectUrl}`);
      expect(req.session.clientOauthSessionId).to.be.null;
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
        id: "1",
        url: "/journey/next",
        session: { ipvSessionId: "ipv-session-id", ipAddress: "ip-address" },
        log: { info: sinon.fake(), error: sinon.fake() },
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
        sinon.match.has("message", "Client Response redirect url is missing"),
      );
    });
  });

  context(
    "handling different journey actions being passed into the request",
    () => {
      it("should post with journey/end", async function () {
        req = {
          id: "1",
          body: { journey: "end" },
          session: { ipvSessionId: "ipv-session-id", ipAddress: "ip-address" },
          log: { info: sinon.fake(), error: sinon.fake() },
        };

        await middleware.handleJourneyAction(req, res, next);
        expect(axiosStub.post.firstCall).to.have.been.calledWith(
          `${configStub.API_BASE_URL}/journey/end`,
        );
      });

      it("should post with journey/attempt-recovery", async function () {
        req = {
          id: "1",
          body: { journey: "attempt-recovery" },
          session: { ipvSessionId: "ipv-session-id", ipAddress: "ip-address" },
          log: { info: sinon.fake(), error: sinon.fake() },
        };

        await middleware.handleJourneyAction(req, res, next);
        expect(axiosStub.post.firstCall).to.have.been.calledWith(
          `${configStub.API_BASE_URL}/journey/attempt-recovery`,
        );
      });

      it("should post with journey/build-client-oauth-response and use ip address from header when not present in session", async function () {
        req = {
          id: "1",
          body: { journey: "build-client-oauth-response" },
          session: { ipvSessionId: "ipv-session-id" },
          headers: { forwarded: "1.1.1.1" },
          log: { info: sinon.fake(), error: sinon.fake() },
        };

        await middleware.handleJourneyAction(req, res, next);
        expect(axiosStub.post.firstCall).to.have.been.calledWith(
          `${configStub.API_BASE_URL}/journey/build-client-oauth-response`,
        );
        expect(req.session.ipAddress).to.equal("1.1.1.1");
      });

      it("should post with journey/build-client-oauth-response and use ip address from session when it is present in session", async function () {
        req = {
          id: "1",
          body: { journey: "build-client-oauth-response" },
          session: { ipvSessionId: "ipv-session-id", ipAddress: "ip-address" },
          headers: { forwarded: "1.1.1.1" },
          log: { info: sinon.fake(), error: sinon.fake() },
        };

        await middleware.handleJourneyAction(req, res, next);
        expect(axiosStub.post.firstCall).to.have.been.calledWith(
          `${configStub.API_BASE_URL}/journey/build-client-oauth-response`,
        );
        expect(req.session.ipAddress).to.equal("ip-address");
      });

      it("should post with journey/next by default", async function () {
        await middleware.handleJourneyAction(req, res, next);
        expect(axiosStub.post.firstCall).to.have.been.calledWith(
          `${configStub.API_BASE_URL}/journey/next`,
        );
      });
    },
  );

  context("handling missing ipvSessionId before calling the backend", () => {
    it("should render the technical unrecoverable page", async function () {
      req = {
        id: "1",
        session: {
          currentPage: "page-ipv-identity-document-start",
          ipvSessionId: null,
          ipAddress: "ip-address",
        },
        log: { info: sinon.fake(), error: sinon.fake() },
      };

      await middleware.handleJourneyAction(req, res, next);
      expect(res.status).to.have.been.calledWith(401);
      expect(res.render).to.have.been.calledWith(
        "ipv/pyi-technical-unrecoverable.njk",
      );
    });
  });

  context("handling page-ipv-reuse journey route", () => {
    const pageId = "page-ipv-reuse";
    it("should call build-proven-user-identity-details endpoint and user details passed into renderer", async function () {
      const axiosResponse = {};
      axiosResponse.status = 200;
      axiosResponse.data = {
        name: "firstName LastName",
        dateOfBirth: "01 11 1973",
        addresses: [
          {
            organisationName: "My company",
            departmentName: "My deparment",
            buildingName: "my building",
            subBuildingName: "Room 5",
            buildingNumber: "1",
            dependentStreetName: "My outter street",
            streetName: "my inner street",
            doubleDependentAddressLocality: "My double dependant town",
            dependentAddressLocality: "my dependant town",
            addressLocality: "my town",
            postalCode: "myCode",
          },
        ],
      };

      const expectedUserDetail = {
        name: "firstName LastName",
        dateOfBirth: "01 11 1973",
        addresses: [
          {
            label: "Some label",
            addressDetailHtml:
              "My deparment, My company, Room 5, my building<br>1 My outter street my inner street<br>My double dependant town my dependant town my town<br>myCode",
          },
        ],
      };

      axiosStub.get = sinon.fake.returns(axiosResponse);

      req = {
        id: "1",
        params: { pageId: pageId },
        csrfToken: sinon.fake(),
        session: { currentPage: pageId },
        log: { info: sinon.fake(), error: sinon.fake() },
        i18n: { t: () => "Some label" },
      };

      await middleware.handleJourneyPage(req, res);

      expect(axiosStub.get.firstCall).to.have.been.calledWith(
        `${configStub.API_BASE_URL}${API_BUILD_PROVEN_USER_IDENTITY_DETAILS}`,
      );

      expect(res.render).to.have.been.calledWith(
        `ipv/${pageId}.njk`,
        sinon.match.has("userDetails", expectedUserDetail),
      );
    });
  });

  context("renderAttemptRecoveryPage", () => {
    it("should render attempt recovery page", () => {
      middleware.renderAttemptRecoveryPage(req, res);
      expect(res.render).to.have.been.calledWith(
        "ipv/pyi-attempt-recovery.njk",
      );
    });
  });

  context(
    "handleMultipleDocCheck: handling journey action with journey/ukPassport, journey/drivingLicence, journey/end",
    () => {
      it("should post with journey/ukPassport", async function () {
        req = {
          id: "1",
          body: { journey: "next/passport" },
          session: { ipvSessionId: "ipv-session-id", ipAddress: "ip-address" },
          log: { info: sinon.fake(), error: sinon.fake() },
        };

        await middleware.handleMultipleDocCheck(req, res, next);
        expect(axiosStub.post.firstCall).to.have.been.calledWith(
          `${configStub.API_BASE_URL}/journey/ukPassport`,
        );
      });

      it("should post with journey/drivingLicence", async function () {
        req = {
          id: "1",
          body: { journey: "next/driving-licence" },
          session: { ipvSessionId: "ipv-session-id", ipAddress: "ip-address" },
          log: { info: sinon.fake(), error: sinon.fake() },
        };

        await middleware.handleMultipleDocCheck(req, res, next);
        expect(axiosStub.post.firstCall).to.have.been.calledWith(
          `${configStub.API_BASE_URL}/journey/drivingLicence`,
        );
      });

      it("should post with journey/end by default", async function () {
        await middleware.handleMultipleDocCheck(req, res, next);
        expect(axiosStub.post.firstCall).to.have.been.calledWith(
          `${configStub.API_BASE_URL}/journey/end`,
        );
      });
    },
  );

  context(
    "handleMultipleDocCheck: handling missing ipvSessionId before calling the backend",
    () => {
      it("should render the technical unrecoverable page", async function () {
        req = {
          id: "1",
          session: {
            currentPage: "page-ipv-identity-document-start",
            ipvSessionId: null,
            ipAddress: "ip-address",
          },
          log: { info: sinon.fake(), error: sinon.fake() },
        };

        await middleware.handleMultipleDocCheck(req, res, next);
        expect(res.status).to.have.been.calledWith(401);
        expect(res.render).to.have.been.calledWith(
          "ipv/pyi-technical-unrecoverable.njk",
        );
      });
    },
  );

  context(
    "handleCriEscapeAction: handling journey action with journey/f2f, journey/dcmaw, journey/end",
    () => {
      it("should post with journey/f2f", async function () {
        req = {
          id: "1",
          body: { journey: "next/f2f" },
          session: { ipvSessionId: "ipv-session-id", ipAddress: "ip-address" },
          log: { info: sinon.fake(), error: sinon.fake() },
        };

        await middleware.handleCriEscapeAction(req, res, next);
        expect(axiosStub.post.firstCall).to.have.been.calledWith(
          `${configStub.API_BASE_URL}/journey/f2f`,
        );
      });

      it("should post with journey/dcmaw", async function () {
        req = {
          id: "1",
          body: { journey: "next/dcmaw" },
          session: { ipvSessionId: "ipv-session-id", ipAddress: "ip-address" },
          log: { info: sinon.fake(), error: sinon.fake() },
        };

        await middleware.handleCriEscapeAction(req, res, next);
        expect(axiosStub.post.firstCall).to.have.been.calledWith(
          `${configStub.API_BASE_URL}/journey/dcmaw`,
        );
      });

      it("should post with journey/end by default", async function () {
        await middleware.handleCriEscapeAction(req, res, next);
        expect(axiosStub.post.firstCall).to.have.been.calledWith(
          `${configStub.API_BASE_URL}/journey/end`,
        );
      });
    },
  );

  context(
    "handleCriEscapeAction: handling missing ipvSessionId before calling the backend",
    () => {
      it("should render the technical unrecoverable page", async function () {
        req = {
          id: "1",
          session: {
            currentPage: "page-ipv-identity-document-start",
            ipvSessionId: null,
            ipAddress: "ip-address",
          },
          log: { info: sinon.fake(), error: sinon.fake() },
        };

        await middleware.handleCriEscapeAction(req, res, next);
        expect(res.status).to.have.been.calledWith(401);
        expect(res.render).to.have.been.calledWith(
          "ipv/pyi-technical-unrecoverable.njk",
        );
      });
    },
  );

  context("validateFeatureSet", () => {
    beforeEach(() => {
      req = {
        query: {},
        session: {},
      };
      res = {};
      next = sinon.stub();
    });

    it("should call next if featureSet is valid", async () => {
      req.query.featureSet = "F01";
      await middleware.validateFeatureSet(req, res, next);
      expect(req.session.featureSet).to.equal("F01");
      expect(next).to.have.been.calledOnce;
    });

    it("should throw an error if featureSet is invalid", async () => {
      req.query.featureSet = "invalid-featureset";
      await middleware.validateFeatureSet(req, res, next);
      expect(next).to.have.been.calledWith(
        sinon.match
          .instanceOf(Error)
          .and(sinon.match.has("message", "Invalid feature set ID")),
      );
      expect(req.session.featureSet).to.be.undefined;
    });
  });

  context("renderFeatureSetPage", () => {
    it("should render featureSet page", () => {
      middleware.renderFeatureSetPage(req, res);
      expect(res.render).to.have.been.calledWith("ipv/page-featureset.njk");
    });
  });
});
