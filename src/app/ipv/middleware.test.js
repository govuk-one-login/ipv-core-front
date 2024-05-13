const proxyquire = require("proxyquire");
const { expect } = require("chai");
const sinon = require("sinon");
const {
  APP_STORE_URL_APPLE,
  APP_STORE_URL_ANDROID,
  SERVICE_URL,
} = require("../../lib/config");
const qrCodeHelper = require("../shared/qrCodeHelper");
const PHONE_TYPES = require("../../constants/phone-types");
const UPDATE_DETAILS_JOURNEY_TYPES = require("../../constants/update-details-journeys");

describe("journey middleware", () => {
  let req;
  let res;
  let next;
  let CoreBackServiceStub = {};

  const configStub = {
    API_BASE_URL: "https://example.org/subpath",
    EXTERNAL_WEBSITE_HOST: "https://callbackaddres.org",
  };

  const sharedCriHelper = proxyquire("../shared/criHelper", {
    "../../services/coreBackService": CoreBackServiceStub,
    "../../lib/config": configStub,
  });

  const middleware = proxyquire("./middleware", {
    "../../services/coreBackService": CoreBackServiceStub,
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
      locals: { contactUsUrl: "contactUrl" },
    };
    req = {
      session: {
        ipvSessionId: "ipv-session-id",
        ipAddress: "ip-address",
        featureSet: "feature-set",
      },
      params: { pageId: "ipv-current-page" },
      csrfToken: sinon.fake(),
      log: { info: sinon.fake(), error: sinon.fake() },
    };
    next = sinon.fake();
    CoreBackServiceStub.postJourneyEvent = sinon.stub();
    CoreBackServiceStub.getProvenIdentityUserDetails = sinon.stub();
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
      const pageId = "pageProvenIdentityUserDetailsTransition";
      const eventResponses = [
        {
          data: { journey: "next" },
        },
        {
          data: { journey: "startCri" },
        },
        {
          data: { page: pageId },
        },
      ];

      const callBack = sinon.stub();
      CoreBackServiceStub.postJourneyEvent = callBack;

      eventResponses.forEach((er, index) => {
        callBack.onCall(index).returns(eventResponses[index]);
      });

      await middleware.handleJourneyResponse(req, res, "next");
      expect(
        CoreBackServiceStub.postJourneyEvent.getCall(0),
      ).to.have.been.calledWith(req, "next");
      expect(
        CoreBackServiceStub.postJourneyEvent.getCall(1),
      ).to.have.been.calledWith(req, "next");
      expect(
        CoreBackServiceStub.postJourneyEvent.getCall(2),
      ).to.have.been.calledWith(req, "startCri");

      expect(res.redirect).to.have.been.calledWith(`/ipv/page/${pageId}`);
    });

    it("should set the status code of the page to render if provided", async function () {
      const callBack = sinon.stub();
      callBack
        .onFirstCall()
        .returns({ data: { page: "a-page-id", statusCode: 418 } });
      CoreBackServiceStub.postJourneyEvent = callBack;

      await middleware.handleJourneyResponse(req, res, "next");

      expect(CoreBackServiceStub.postJourneyEvent).to.have.been.calledWith(
        req,
        "next",
      );

      expect(req.session.currentPageStatusCode).to.equal(418);
      expect(res.redirect).to.have.been.calledWith(`/ipv/page/a-page-id`);
    });
  });

  context("calling the journeyPage endpoint", () => {
    beforeEach(() => {
      req = {
        id: "1",
        url: "/ipv/page",
        params: { pageId: "prove-identity-bank-account" },
        session: {
          ipvSessionId: "ipv-session-id",
          ipAddress: "ip-address",
          currentPage: "prove-identity-bank-account",
          save: sinon.fake.yields(null),
        },
        log: { info: sinon.fake(), error: sinon.fake() },
        csrfToken: sinon.fake(),
      };
    });

    it("should render page case when given valid pageId", async () => {
      await middleware.handleJourneyPage(req, res);

      expect(res.render).to.have.been.calledWith(
        "ipv/page/prove-identity-bank-account.njk",
      );
    });

    it("should set the response status code from a value in the session if present", async () => {
      req.session.currentPageStatusCode = 418;

      await middleware.handleJourneyPage(req, res);

      expect(res.render).to.have.been.calledWith(
        "ipv/page/prove-identity-bank-account.njk",
      );
      expect(res.status).to.have.been.calledWith(418);
      expect(req.session.currentPageStatusCode).to.equal(undefined);
    });

    it("should render page not found error page when given invalid pageId", async () => {
      req.params = { pageId: "page-this-is-invalid" };
      req.session.currentPage = "page-this-is-invalid";

      await middleware.handleJourneyPage(req, res);

      expect(res.render).to.have.been.calledWith("errors/page-not-found.njk");
    });

    it("should render unrecoverable timeout error page when given unrecoverable timeout pageId", async () => {
      req.params = { pageId: "pyi-timeout-unrecoverable" };

      await middleware.handleJourneyPage(req, res);

      expect(res.render).to.have.been.calledWith(
        "ipv/page/pyi-timeout-unrecoverable.njk",
      );
    });

    it("should render attempt recovery error page when current page is not equal to pageId", async () => {
      req.session.currentPage = "page-multiple-doc-check";

      await middleware.handleJourneyPage(req, res);

      expect(res.redirect).to.have.been.calledWith(
        "/ipv/page/pyi-attempt-recovery",
      );
    });

    it("should raise an error when missing params", async () => {
      delete req.params;

      await middleware.handleJourneyPage(req, res, next);

      expect(next).to.have.been.calledWith(sinon.match.instanceOf(Error));
    });

    it("should render pyi-technical page with 'unrecoverable' context if ipvSessionId is null", async () => {
      req.session.ipvSessionId = null;

      await middleware.handleJourneyPage(req, res);

      expect(res.render).to.have.been.calledWith("ipv/page/pyi-technical.njk", {
        context: "unrecoverable",
      });
    });

    it("should render pyi-technical page with 'unrecoverable' context if ipvSessionId is undefined", async () => {
      delete req.session.ipvSessionId;

      await middleware.handleJourneyPage(req, res);

      expect(res.render).to.have.been.calledWith("ipv/page/pyi-technical.njk", {
        context: "unrecoverable",
      });
    });

    it("should render with errorState if in query", async function () {
      req.query = { errorState: "some error state" };

      await middleware.handleJourneyPage(req, res, next);

      expect(res.render).to.have.been.calledWith(
        `ipv/page/prove-identity-bank-account.njk`,
        sinon.match.has("pageErrorState", "some error state"),
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
      CoreBackServiceStub.postJourneyEvent = callBack;

      eventResponses.forEach((er, index) => {
        callBack.onCall(index).returns(eventResponses[index]);
      });
    });

    afterEach(() => {
      sinon.restore();
    });

    it("should be redirected to a valid redirectURL", async function () {
      await middleware.handleJourneyResponse(req, res, "next");
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
          body: { journey: "next" },
          session: { ipvSessionId: "ipv-session-id", ipAddress: "ip-address" },
          log: { info: sinon.fake(), error: sinon.fake() },
          params: { pageId: "ipv-current-page" },
        };

        const callBack = sinon.stub();
        CoreBackServiceStub.postJourneyEvent = callBack;

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
      CoreBackServiceStub.postJourneyEvent = callBack;

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
      await middleware.handleJourneyResponse(req, res, "next");
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
        body: { journey: "next" },
        session: { ipvSessionId: "ipv-session-id", ipAddress: "ip-address" },
        log: { info: sinon.fake(), error: sinon.fake() },
        params: { pageId: "ipv-current-page" },
      };

      const callBack = sinon.stub();
      CoreBackServiceStub.postJourneyEvent = callBack;

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
      it("should postJourneyEvent with end", async function () {
        req = {
          id: "1",
          body: { journey: "end" },
          session: { ipvSessionId: "ipv-session-id", ipAddress: "ip-address" },
          log: { info: sinon.fake(), error: sinon.fake() },
          params: { pageId: "ipv-current-page" },
        };

        await middleware.handleJourneyAction(req, res, next);
        expect(
          CoreBackServiceStub.postJourneyEvent.firstCall,
        ).to.have.been.calledWith(req, "end", "ipv-current-page");
      });

      it("should postJourneyEvent with attempt-recovery", async function () {
        req = {
          id: "1",
          body: { journey: "attempt-recovery" },
          session: { ipvSessionId: "ipv-session-id", ipAddress: "ip-address" },
          log: { info: sinon.fake(), error: sinon.fake() },
          params: { pageId: "ipv-current-page" },
        };

        await middleware.handleJourneyAction(req, res, next);
        expect(
          CoreBackServiceStub.postJourneyEvent.firstCall,
        ).to.have.been.calledWith(req, "attempt-recovery", "ipv-current-page");
      });

      it("should postJourneyEvent with build-client-oauth-response and use ip address from header when not present in session", async function () {
        req = {
          id: "1",
          body: { journey: "build-client-oauth-response" },
          session: { ipvSessionId: "ipv-session-id" },
          headers: { forwarded: "1.1.1.1" },
          log: { info: sinon.fake(), error: sinon.fake() },
          params: { pageId: "ipv-current-page" },
        };

        await middleware.handleJourneyAction(req, res, next);
        expect(
          CoreBackServiceStub.postJourneyEvent.firstCall,
        ).to.have.been.calledWith(
          req,
          "build-client-oauth-response",
          "ipv-current-page",
        );
      });

      it("should postJourneyEvent with build-client-oauth-response and use ip address from session when it is present in session", async function () {
        req = {
          id: "1",
          body: { journey: "build-client-oauth-response" },
          session: { ipvSessionId: "ipv-session-id", ipAddress: "ip-address" },
          headers: { forwarded: "1.1.1.1" },
          log: { info: sinon.fake(), error: sinon.fake() },
          params: { pageId: "ipv-current-page" },
        };

        await middleware.handleJourneyAction(req, res, next);
        expect(
          CoreBackServiceStub.postJourneyEvent.firstCall,
        ).to.have.been.calledWith(
          req,
          "build-client-oauth-response",
          "ipv-current-page",
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
        params: { pageId: "ipv-current-page" },
        log: { info: sinon.fake(), error: sinon.fake() },
      };

      await middleware.handleJourneyAction(req, res, next);
      expect(res.status).to.have.been.calledWith(401);
      expect(res.render).to.have.been.calledWith("ipv/page/pyi-technical.njk", {
        context: "unrecoverable",
      });
    });
  });

  context("handling page-ipv-reuse journey route", () => {
    const pageId = "page-ipv-reuse";
    it("should call build-proven-user-identity-details endpoint and user details passed into renderer", async function () {
      const axiosResponse = {};
      axiosResponse.status = 200;
      axiosResponse.data = {
        name: "firstName LastName",
        nameParts: [
          { type: "GivenName", value: "firstName" },
          { type: "FamilyName", value: "LastName" },
        ],
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
        nameParts: {
          givenName: "firstName",
          familyName: "LastName",
        },
        dateOfBirth: "01 11 1973",
        addresses: [
          {
            label: "Some label",
            addressDetailHtml:
              "My deparment, My company, Room 5, my building<br>1 My outter street my inner street<br>My double dependant town my dependant town my town<br>myCode",
          },
        ],
      };

      CoreBackServiceStub.getProvenIdentityUserDetails =
        sinon.fake.returns(axiosResponse);

      req = {
        id: "1",
        params: { pageId: pageId },
        csrfToken: sinon.fake(),
        session: { currentPage: pageId, ipvSessionId: "a-session-id" },
        log: { info: sinon.fake(), error: sinon.fake() },
        i18n: { t: () => "Some label" },
      };

      await middleware.handleJourneyPage(req, res);

      expect(
        CoreBackServiceStub.getProvenIdentityUserDetails.firstCall,
      ).to.have.been.calledWith(req);

      expect(res.render).to.have.been.calledWith(
        `ipv/page/${pageId}.njk`,
        sinon.match.has("userDetails", expectedUserDetail),
      );
    });

    it("should call build-proven-user-identity-details endpoint and user details passed into renderer with multiple given names", async function () {
      const axiosResponse = {};
      axiosResponse.status = 200;
      axiosResponse.data = {
        name: "firstName MiddleName LastName",
        nameParts: [
          { type: "GivenName", value: "firstName" },
          { type: "GivenName", value: "MiddleName" },
          { type: "FamilyName", value: "LastName" },
        ],
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
        name: "firstName MiddleName LastName",
        nameParts: {
          givenName: "firstName MiddleName",
          familyName: "LastName",
        },
        dateOfBirth: "01 11 1973",
        addresses: [
          {
            label: "Some label",
            addressDetailHtml:
              "My deparment, My company, Room 5, my building<br>1 My outter street my inner street<br>My double dependant town my dependant town my town<br>myCode",
          },
        ],
      };

      CoreBackServiceStub.getProvenIdentityUserDetails =
        sinon.fake.returns(axiosResponse);

      req = {
        id: "1",
        params: { pageId: pageId },
        csrfToken: sinon.fake(),
        session: { currentPage: pageId, ipvSessionId: "a-session-id" },
        log: { info: sinon.fake(), error: sinon.fake() },
        i18n: { t: () => "Some label" },
      };

      await middleware.handleJourneyPage(req, res);

      expect(
        CoreBackServiceStub.getProvenIdentityUserDetails.firstCall,
      ).to.have.been.calledWith(req);

      expect(res.render).to.have.been.calledWith(
        `ipv/page/${pageId}.njk`,
        sinon.match.has("userDetails", expectedUserDetail),
      );
    });
  });

  context("renderAttemptRecoveryPage", () => {
    it("should render attempt recovery page", () => {
      middleware.renderAttemptRecoveryPage(req, res);
      expect(res.render).to.have.been.calledWith(
        "ipv/page/pyi-attempt-recovery.njk",
      );
    });
  });

  context(
    "handleJourneyAction: handling journey action with ukPassport, drivingLicence, end",
    () => {
      it("should postJourneyEvent with ukPassport", async function () {
        req = {
          id: "1",
          body: { journey: "ukPassport" },
          session: { ipvSessionId: "ipv-session-id", ipAddress: "ip-address" },
          log: { info: sinon.fake(), error: sinon.fake() },
          params: { pageId: "ipv-current-page" },
        };

        await middleware.handleJourneyAction(req, res, next);
        expect(
          CoreBackServiceStub.postJourneyEvent.firstCall,
        ).to.have.been.calledWith(req, "ukPassport", "ipv-current-page");
      });

      it("should postJourneyEvent with drivingLicence", async function () {
        req = {
          id: "1",
          body: { journey: "drivingLicence" },
          session: { ipvSessionId: "ipv-session-id", ipAddress: "ip-address" },
          log: { info: sinon.fake(), error: sinon.fake() },
          params: { pageId: "ipv-current-page" },
        };

        await middleware.handleJourneyAction(req, res, next);
        expect(
          CoreBackServiceStub.postJourneyEvent.firstCall,
        ).to.have.been.calledWith(req, "drivingLicence", "ipv-current-page");
      });
    },
  );

  context(
    "handleJourneyAction: handling journey action events - 'contact', 'end'",
    () => {
      it("should postJourneyEvent with end", async function () {
        req = {
          id: "1",
          body: { journey: "end" },
          session: { ipvSessionId: "ipv-session-id", ipAddress: "ip-address" },
          log: { info: sinon.fake(), error: sinon.fake() },
          params: { pageId: "ipv-current-page" },
        };

        await middleware.handleJourneyAction(req, res, next);
        expect(
          CoreBackServiceStub.postJourneyEvent.firstCall,
        ).to.have.been.calledWith(req, "end", "ipv-current-page");
      });

      it("should call saveAndRedirect given 'contact' event", async function () {
        req = {
          id: "1",
          body: { journey: "contact" },
          session: {
            ipvSessionId: "ipv-session-id",
            ipAddress: "ip-address",
            save: sinon.fake.yields(null),
          },
          log: { info: sinon.fake(), error: sinon.fake() },
          params: { pageId: "ipv-current-page" },
        };

        await middleware.handleJourneyAction(req, res, next);
        expect(res.redirect).to.have.been.calledWith("contactUrl");
      });
    },
  );

  context(
    "handleJourneyAction: handling journey action with next, bankAccount, end",
    () => {
      it("should postJourneyEvent with next", async function () {
        req = {
          id: "1",
          body: { journey: "next" },
          session: { ipvSessionId: "ipv-session-id", ipAddress: "ip-address" },
          log: { info: sinon.fake(), error: sinon.fake() },
          params: { pageId: "ipv-current-page" },
        };

        await middleware.handleJourneyAction(req, res, next);
        expect(
          CoreBackServiceStub.postJourneyEvent.firstCall,
        ).to.have.been.calledWith(req, "next", "ipv-current-page");
      });

      it("should postJourneyEvent with bankAccount", async function () {
        req = {
          id: "1",
          body: { journey: "bankAccount" },
          session: { ipvSessionId: "ipv-session-id", ipAddress: "ip-address" },
          log: { info: sinon.fake(), error: sinon.fake() },
          params: { pageId: "ipv-current-page" },
        };

        await middleware.handleJourneyAction(req, res, next);
        expect(
          CoreBackServiceStub.postJourneyEvent.firstCall,
        ).to.have.been.calledWith(req, "bankAccount", "ipv-current-page");
      });
    },
  );

  context(
    "handleJourneyAction: handling missing ipvSessionId before calling the backend",
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
          params: { pageId: "page-ipv-identity-document-start" },
        };

        await middleware.handleJourneyAction(req, res, next);
        expect(res.status).to.have.been.calledWith(401);
        expect(res.render).to.have.been.calledWith(
          "ipv/page/pyi-technical.njk",
          {
            context: "unrecoverable",
          },
        );
      });
    },
  );

  context(
    "handleJourneyAction: handling journey action with f2f, dcmaw, end",
    () => {
      it("should postJourneyEvent with f2f", async function () {
        req = {
          id: "1",
          body: { journey: "f2f" },
          session: { ipvSessionId: "ipv-session-id", ipAddress: "ip-address" },
          log: { info: sinon.fake(), error: sinon.fake() },
          params: { pageId: "ipv-current-page" },
        };

        await middleware.handleJourneyAction(
          req,
          res,
          next,
          "ipv-current-page",
        );
        expect(
          CoreBackServiceStub.postJourneyEvent.firstCall,
        ).to.have.been.calledWith(req, "f2f", "ipv-current-page");
      });

      it("should postJourneyEvent with dcmaw", async function () {
        req = {
          id: "1",
          body: { journey: "dcmaw" },
          session: { ipvSessionId: "ipv-session-id", ipAddress: "ip-address" },
          log: { info: sinon.fake(), error: sinon.fake() },
          params: { pageId: "ipv-current-page" },
        };

        await middleware.handleJourneyAction(req, res, next);
        expect(
          CoreBackServiceStub.postJourneyEvent.firstCall,
        ).to.have.been.calledWith(req, "dcmaw", "ipv-current-page");
      });
    },
  );

  context(
    "handleJourneyAction: handling missing ipvSessionId before calling the backend",
    () => {
      it("should render the technical unrecoverable page", async function () {
        req = {
          id: "1",
          session: {
            currentPage: "page-ipv-identity-document-start",
            ipvSessionId: null,
            ipAddress: "ip-address",
          },
          params: { pageId: "page-ipv-identity-document-start" },
          log: { info: sinon.fake(), error: sinon.fake() },
        };

        await middleware.handleJourneyAction(req, res, next);
        expect(res.status).to.have.been.calledWith(401);
        expect(res.render).to.have.been.calledWith(
          "ipv/page/pyi-technical.njk",
          {
            context: "unrecoverable",
          },
        );
      });
    },
  );

  context(
    "handleJourneyAction: handling missing ipv session and oauth id before calling the backend",
    () => {
      it("should render the technical unrecoverable page", async function () {
        req = {
          id: "1",
          session: {
            currentPage: "pyi-suggest-other-options",
            ipvSessionId: null,
            ipAddress: "ip-address",
          },
          params: { pageId: "pyi-suggest-other-options" },
          log: { info: sinon.fake(), error: sinon.fake() },
        };

        await middleware.handleJourneyAction(req, res, next);
        expect(res.status).to.have.been.calledWith(401);
        expect(res.render).to.have.been.calledWith(
          "ipv/page/pyi-technical.njk",
          {
            context: "unrecoverable",
          },
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

    it("should call next if comma separated multiple featureSet is valid", async () => {
      req.query.featureSet = "F01,D01";
      await middleware.validateFeatureSet(req, res, next);
      expect(req.session.featureSet).to.equal("F01,D01");
      expect(next).to.have.been.calledOnce;
    });

    it("should throw an error if comma separated featureSet is invalid", async () => {
      req.query.featureSet = "F01, D01";
      await middleware.validateFeatureSet(req, res, next);
      expect(next).to.have.been.calledWith(
        sinon.match
          .instanceOf(Error)
          .and(sinon.match.has("message", "Invalid feature set ID")),
      );
      expect(req.session.featureSet).to.be.undefined;
    });

    it("should throw an error if comma not followed by text for featureSet is invalid", async () => {
      req.query.featureSet = "F01,";
      await middleware.validateFeatureSet(req, res, next);
      expect(next).to.have.been.calledWith(
        sinon.match
          .instanceOf(Error)
          .and(sinon.match.has("message", "Invalid feature set ID")),
      );
      expect(req.session.featureSet).to.be.undefined;
    });

    it("should throw an error if empty featureSet is invalid", async () => {
      req.query.featureSet = "";
      await middleware.validateFeatureSet(req, res, next);
      expect(next).to.have.been.calledWith(
        sinon.match
          .instanceOf(Error)
          .and(sinon.match.has("message", "Invalid feature set ID")),
      );
      expect(req.session.featureSet).to.be.undefined;
    });

    it("should throw an error if blank space featureSet is invalid", async () => {
      req.query.featureSet = " ";
      await middleware.validateFeatureSet(req, res, next);
      expect(next).to.have.been.calledWith(
        sinon.match
          .instanceOf(Error)
          .and(sinon.match.has("message", "Invalid feature set ID")),
      );
      expect(req.session.featureSet).to.be.undefined;
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

  context("formRadioButtonChecked middleware", () => {
    beforeEach(() => {
      req = {
        body: {},
        params: { pageId: "page-ipv-identity-document-start" },
        csrfToken: sinon.fake(),
        session: {
          currentPage: "page-ipv-identity-document-start",
          save: sinon.fake.yields(null),
        },
        log: { error: sinon.fake() },
      };
    });

    it("should render if method is postJourneyEvent, journey is not defined", async function () {
      req.body.journey = undefined;
      req.method = "POST";
      await middleware.formRadioButtonChecked(req, res, next);

      expect(res.render).to.have.been.called;
      expect(next).to.have.not.been.calledOnce;
    });

    it("should not render if method is not postJourneyEvent", async function () {
      req.method = "GET";
      req.body.journey = undefined;
      await middleware.formRadioButtonChecked(req, res, next);

      expect(res.render).to.not.have.been.called;
      expect(next).to.have.been.calledOnce;
    });

    it("should not render if journey is defined", async function () {
      req.body.journey = "someJourney";
      await middleware.formRadioButtonChecked(req, res, next);

      expect(res.render).to.not.have.been.called;
      expect(next).to.have.been.calledOnce;
    });

    it("should fetch user details if required", async function () {
      CoreBackServiceStub.getProvenIdentityUserDetails = sinon.stub();

      req.session.currentPage = "page-ipv-reuse";
      req.params.pageId = "page-ipv-reuse";
      req.method = "POST";

      await middleware.formRadioButtonChecked(req, res, next);

      expect(CoreBackServiceStub.getProvenIdentityUserDetails).to.have.been
        .called;
      expect(res.render).to.not.have.been.called;
      expect(next).to.have.been.calledOnce;
    });

    it("should handle unexpected pages", async function () {
      CoreBackServiceStub.getProvenIdentityUserDetails = sinon.stub();

      req.session.currentPage = "page-ipv-reuse";
      req.method = "POST";

      await middleware.formRadioButtonChecked(req, res, next);

      expect(CoreBackServiceStub.getProvenIdentityUserDetails).to.not.have.been
        .called;
      expect(res.render).to.not.have.been.called;
      expect(res.redirect).to.have.been.calledWith(
        "/ipv/page/pyi-attempt-recovery",
      );
    });

    it("should call next in case of a successful execution", async function () {
      req.body.journey = "dcmaw";

      await middleware.formRadioButtonChecked(req, res, next);

      expect(res.render).to.not.have.been.called;
      expect(next).to.have.been.calledOnce;
    });
  });

  context("handling pyi-triage-desktop-download-app journey route", () => {
    beforeEach(() => {
      req = {
        body: {},
        params: { pageId: "pyi-triage-desktop-download-app" },
        session: {
          ipvSessionId: "ipv-session-id",
          currentPage: "pyi-triage-desktop-download-app",
        },
        csrfToken: sinon.fake(),
        log: { info: sinon.fake(), error: sinon.fake() },
      };
    });

    it("sets an iPhone qrCode value for the page", async function () {
      req.method = "GET";
      req.session.context = "iphone";
      const qrCodeUrl = SERVICE_URL + "/ipv/app-redirect/" + PHONE_TYPES.IPHONE;
      const expectedQrCodeData =
        await qrCodeHelper.generateQrCodeImageData(qrCodeUrl);

      await middleware.handleJourneyPage(req, res, next);

      expect(res.render).to.have.been.calledWith(
        `ipv/page/pyi-triage-desktop-download-app.njk`,
        sinon.match.has("qrCode", expectedQrCodeData),
      );
    });

    it("sets an Android qrCode value for the page", async function () {
      req.method = "GET";
      req.session.context = "android";
      const qrCodeUrl =
        SERVICE_URL + "/ipv/app-redirect/" + PHONE_TYPES.ANDROID;
      const expectedQrCodeData =
        await qrCodeHelper.generateQrCodeImageData(qrCodeUrl);

      await middleware.handleJourneyPage(req, res, next);

      expect(res.render).to.have.been.calledWith(
        `ipv/page/pyi-triage-desktop-download-app.njk`,
        sinon.match.has("qrCode", expectedQrCodeData),
      );
    });
  });

  context("handling pyi-triage-mobile-download-app journey route", () => {
    beforeEach(() => {
      req = {
        body: {},
        params: { pageId: "pyi-triage-mobile-download-app" },
        session: {
          ipvSessionId: "ipv-session-id",
          currentPage: "pyi-triage-mobile-download-app",
        },
        csrfToken: sinon.fake(),
        log: { info: sinon.fake(), error: sinon.fake() },
      };
    });

    it("sets an Android appDownloadUrl value for the page", async function () {
      req.method = "GET";
      req.session.context = "android";

      await middleware.handleJourneyPage(req, res, next);

      expect(res.render).to.have.been.calledWith(
        `ipv/page/pyi-triage-mobile-download-app.njk`,
        sinon.match.has(
          "appDownloadUrl",
          SERVICE_URL + "/ipv/app-redirect/" + PHONE_TYPES.ANDROID,
        ),
      );
    });

    it("sets an iPhone appDownloadUrl value for the page", async function () {
      req.method = "GET";
      req.session.context = "iphone";

      await middleware.handleJourneyPage(req, res, next);

      expect(res.render).to.have.been.calledWith(
        `ipv/page/pyi-triage-mobile-download-app.njk`,
        sinon.match.has(
          "appDownloadUrl",
          SERVICE_URL + "/ipv/app-redirect/" + PHONE_TYPES.IPHONE,
        ),
      );
    });
  });

  context("redirect to app store", () => {
    beforeEach(() => {
      req = {
        headers: {},
        body: {},
        params: {},
      };
    });

    it("redirects to the apple store if the user said they have an iphone", async function () {
      req.params.specifiedPhoneType = PHONE_TYPES.IPHONE;
      req.method = "GET";
      await middleware.handleAppStoreRedirect(req, res, next);

      expect(res.redirect).to.have.been.calledWith(APP_STORE_URL_APPLE);
    });

    it("redirects to the android store if the user said they have an android", async function () {
      req.params.specifiedPhoneType = PHONE_TYPES.ANDROID;
      req.method = "GET";
      await middleware.handleAppStoreRedirect(req, res, next);

      expect(res.redirect).to.have.been.calledWith(APP_STORE_URL_ANDROID);
    });

    it("throws an error for a bad phone type", async function () {
      req.params.specifiedPhoneType = "notaphone";
      req.method = "GET";
      await middleware.handleAppStoreRedirect(req, res, next);

      expect(next).to.be.calledWith(sinon.match.instanceOf(Error));
    });
  });

  context("handle unknown backend response", () => {
    let eventResponses = [];
    beforeEach(() => {
      eventResponses = [
        {
          data: {
            test: "unknown-response",
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
      CoreBackServiceStub.postAction = callBack;

      eventResponses.forEach((er, index) => {
        callBack.onCall(index).returns(eventResponses[index]);
      });
    });

    afterEach(() => {
      sinon.restore();
    });

    it("should throw an error when receiving an unexpected backend response", async function () {
      expect(
        middleware.handleJourneyResponse(req, res, "/journey/next"),
      ).to.be.rejectedWith("Unexpected backend response");
    });
  });

  context("formHandleUpdateDetailsCheckBox middleware", () => {
    beforeEach(() => {
      req = {
        body: {},
        params: { pageId: "update-details" },
        csrfToken: sinon.fake(),
        session: {
          currentPage: "update-details",
          save: sinon.fake.yields(null),
        },
        log: { error: sinon.fake() },
      };
    });

    it("should not set journey if detailsToUpdate is empty", async function () {
      req.body.detailsToUpdate = [];
      await middleware.formHandleUpdateDetailsCheckBox(req, res, next);
      expect(next).to.have.been.calledOnce;
      expect(req.body.journey).to.equal(undefined);
    });

    it("should not set journey if detailsToUpdate is undefined", async function () {
      req.body.detailsToUpdate = undefined;
      await middleware.formHandleUpdateDetailsCheckBox(req, res, next);
      expect(next).to.have.been.calledOnce;
      expect(req.body.journey).to.equal(undefined);
    });

    it("should set journey to UPDATE_CANCEL if detailsToUpdate is cancel", async function () {
      req.body.detailsToUpdate = "cancel";
      await middleware.formHandleUpdateDetailsCheckBox(req, res, next);
      expect(next).to.have.been.calledOnce;
      expect(req.body.journey).to.equal(
        UPDATE_DETAILS_JOURNEY_TYPES.UPDATE_CANCEL,
      );
    });

    it("should set journey to undefined if detailsToUpdate is cancel and address", async function () {
      req.body.detailsToUpdate = ["cancel", "address"];
      await middleware.formHandleUpdateDetailsCheckBox(req, res, next);
      expect(next).to.have.been.calledOnce;
      expect(req.body.journey).to.equal(undefined);
    });

    it("should set journey to UPDATE_NAMES_DOB if detailsToUpdate is dateOfBirth", async function () {
      req.body.detailsToUpdate = "dateOfBirth";
      await middleware.formHandleUpdateDetailsCheckBox(req, res, next);
      expect(next).to.have.been.calledOnce;
      expect(req.body.journey).to.equal(
        UPDATE_DETAILS_JOURNEY_TYPES.UPDATE_NAMES_DOB,
      );
    });

    it("should set journey to UPDATE_GIVEN_NAMES if detailsToUpdate is givenNames", async function () {
      req.body.detailsToUpdate = "givenNames";
      await middleware.formHandleUpdateDetailsCheckBox(req, res, next);
      expect(next).to.have.been.calledOnce;
      expect(req.body.journey).to.equal(
        UPDATE_DETAILS_JOURNEY_TYPES.UPDATE_GIVEN_NAMES,
      );
    });

    it("should set journey to UPDATE_FAMILY_NAME if detailsToUpdate is lastName", async function () {
      req.body.detailsToUpdate = ["familyName"];
      await middleware.formHandleUpdateDetailsCheckBox(req, res, next);
      expect(next).to.have.been.calledOnce;
      expect(req.body.journey).to.equal(
        UPDATE_DETAILS_JOURNEY_TYPES.UPDATE_FAMILY_NAME,
      );
    });

    it("should set journey to UPDATE_ADDRESS if detailsToUpdate is address", async function () {
      req.body.detailsToUpdate = "address";
      await middleware.formHandleUpdateDetailsCheckBox(req, res, next);
      expect(next).to.have.been.calledOnce;
      expect(req.body.journey).to.equal(
        UPDATE_DETAILS_JOURNEY_TYPES.UPDATE_ADDRESS,
      );
    });

    it("should set journey to UPDATE_NAMES_DOB if detailsToUpdate is givenNames and lastName", async function () {
      req.body.detailsToUpdate = ["givenNames", "familyName"];
      await middleware.formHandleUpdateDetailsCheckBox(req, res, next);
      expect(next).to.have.been.calledOnce;
      expect(req.body.journey).to.equal(
        UPDATE_DETAILS_JOURNEY_TYPES.UPDATE_NAMES_DOB,
      );
    });

    it("should set journey to UPDATE_GIVEN_NAME_ADDRESS if detailsToUpdate is givenNames and address", async function () {
      req.body.detailsToUpdate = ["givenNames", "address"];
      await middleware.formHandleUpdateDetailsCheckBox(req, res, next);
      expect(next).to.have.been.calledOnce;
      expect(req.body.journey).to.equal(
        UPDATE_DETAILS_JOURNEY_TYPES.UPDATE_GIVEN_NAMES_ADDRESS,
      );
    });

    it("should set journey to UPDATE_FAMILY_NAME_ADDRESS if detailsToUpdate is lastName and address", async function () {
      req.body.detailsToUpdate = ["familyName", "address"];
      await middleware.formHandleUpdateDetailsCheckBox(req, res, next);
      expect(next).to.have.been.calledOnce;
      expect(req.body.journey).to.equal(
        UPDATE_DETAILS_JOURNEY_TYPES.UPDATE_FAMILY_NAME_ADDRESS,
      );
    });

    it("should set journey to UPDATE_NAMES_DOB if detailsToUpdate is givenNames, lastName, dateOfBirth, address", async function () {
      req.body.detailsToUpdate = [
        "givenNames",
        "lastName",
        "dateOfBirth",
        "address",
      ];
      await middleware.formHandleUpdateDetailsCheckBox(req, res, next);
      expect(next).to.have.been.calledOnce;
      expect(req.body.journey).to.equal(
        UPDATE_DETAILS_JOURNEY_TYPES.UPDATE_NAMES_DOB,
      );
    });
  });
});
