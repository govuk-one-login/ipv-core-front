import { Response, Request, NextFunction } from "express";
import { expect } from "chai";
import sinon from "sinon";
import { AxiosResponse } from "axios";
import proxyquire from "proxyquire";

import config from "../../lib/config";
import qrCodeHelper from "../shared/qrCodeHelper";
import PHONE_TYPES from "../../constants/phone-types";
import { SUPPORTED_COMBO_EVENTS } from "../../constants/update-details-journeys";
import {
  IDENTIFY_DEVICE,
  PROVE_IDENTITY_NO_PHOTO_ID,
} from "../../constants/ipv-pages";
import { PostJourneyEventResponse } from "../validators/postJourneyEventResponse";

describe("journey middleware", () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  const coreBackServiceStub = {
    postJourneyEvent: sinon.spy(),
    getProvenIdentityUserDetails: sinon.spy(),
    postAction: sinon.fake(),
  };

  const configStub = {
    API_BASE_URL: "https://example.org/subpath",
    EXTERNAL_WEBSITE_HOST: "https://callbackaddres.org",
    APP_STORE_URL_ANDROID:
      "https://play.google.com/store/apps/details?id=uk.gov.documentchecking",
    APP_STORE_URL_APPLE:
      "https://apps.apple.com/gb/app/gov-uk-id-check/id1629050566",
  };

  const middleware: typeof import("./middleware") = proxyquire("./middleware", {
    "../../services/coreBackService": coreBackServiceStub,
    "../../lib/config": { default: configStub },
  });

  beforeEach(() => {
    res = {
      status: sinon.fake(),
      redirect: sinon.fake(),
      send: sinon.fake(),
      render: sinon.fake(),
      log: { info: sinon.fake(), error: sinon.fake() },
      locals: { contactUsUrl: "contactUrl", deleteAccountUrl: "deleteAccount" },
    } as any;
    req = {
      session: {
        ipvSessionId: "ipv-session-id",
        ipAddress: "ip-address",
        featureSet: "feature-set",
        save: sinon.fake.yields(null),
      },
      params: { pageId: "page-ipv-identity-document-start" },
      csrfToken: sinon.fake(),
      log: { info: sinon.fake(), error: sinon.fake() },
    } as any;
    next = sinon.fake() as any;

    coreBackServiceStub.postJourneyEvent = sinon.stub();
    coreBackServiceStub.getProvenIdentityUserDetails = sinon.stub();
  });

  context("setRequestPageId", () => {
    it("should return a handler that sets the page ID on a request", async function () {
      const newPageId = "new-page-id";
      const handler = middleware.setRequestPageId(newPageId);

      await handler(req, res, next);

      expect(req.params.pageId).to.equal(newPageId);
      expect(next).to.have.been.called;
    });
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
      } as any;
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
      coreBackServiceStub.postJourneyEvent = callBack;

      eventResponses.forEach((er, index) => {
        callBack.onCall(index).returns(eventResponses[index]);
      });

      await middleware.processAction(req, res, "next");
      expect(
        coreBackServiceStub.postJourneyEvent.getCall(0),
      ).to.have.been.calledWith(req, "next");
      expect(
        coreBackServiceStub.postJourneyEvent.getCall(1),
      ).to.have.been.calledWith(req, "next");
      expect(
        coreBackServiceStub.postJourneyEvent.getCall(2),
      ).to.have.been.calledWith(req, "startCri");

      expect(res.redirect).to.have.been.calledWith(`/ipv/page/${pageId}`);
    });

    it("should set the status code of the page to render if provided", async function () {
      const callBack = sinon.stub();
      callBack
        .onFirstCall()
        .returns({ data: { page: "a-page-id", statusCode: 418 } });
      coreBackServiceStub.postJourneyEvent = callBack;

      await middleware.processAction(req, res, "next");

      expect(coreBackServiceStub.postJourneyEvent).to.have.been.calledWith(
        req,
        "next",
      );

      expect(req.session.currentPageStatusCode).to.equal(418);
      expect(res.redirect).to.have.been.calledWith(`/ipv/page/a-page-id`);
    });
  });

  context("calling the journeyPage endpoint", () => {
    const testReq = {
      id: "1",
      url: "/ipv/page",
      params: { pageId: "prove-identity-no-photo-id" },
      session: {
        ipvSessionId: "ipv-session-id",
        ipAddress: "ip-address",
        currentPage: "prove-identity-no-photo-id",
        save: sinon.fake.yields(null),
      },
      log: { info: sinon.fake(), error: sinon.fake() },
      csrfToken: sinon.fake(),
    } as any;

    it("should render page case when given valid pageId", async () => {
      await middleware.handleJourneyPageRequest(testReq, res, next);

      expect(res.render).to.have.been.calledWith(
        "ipv/page/prove-identity-no-photo-id.njk",
      );
    });

    it("should set the response status code from a value in the session if present", async () => {
      const request = {...testReq, session: {...testReq.session, currentPageStatusCode: 418}}

      await middleware.handleJourneyPageRequest(request, res, next);

      expect(res.render).to.have.been.calledWith(
        "ipv/page/prove-identity-no-photo-id.njk",
      );
      expect(res.status).to.have.been.calledWith(418);
      expect(testReq.session.currentPageStatusCode).to.equal(undefined);
    });

    const errorPageScenarios = [
      {
        req: {...testReq, params: {...testReq.params, pageId: "invalid-page"}},
        scenario: "invalid page id",
        expectedPageRendered: "errors/page-not-found.njk",
      },
      {
        req: {...testReq, params: {...testReq.params, pageId: "pyi-timeout-unrecoverable"}},
        scenario: "unrecoverable timeout pageId",
        expectedPageRendered: "ipv/page/pyi-timeout-unrecoverable.njk",
      },
      {
        req: {...testReq, session: {...testReq.session, ipvSessionId: null}},
        scenario: "ipvSessionId is null",
        expectedPageRendered: "ipv/page/pyi-technical.njk",
        context: "unrecoverable"
      },
      {
        req: {...testReq, session: {...testReq.session, ipvSessionId: undefined}},
        scenario: "ipvSessionId is undefined",
        expectedPageRendered: "ipv/page/pyi-technical.njk",
        context: "unrecoverable"
      },
    ];

    errorPageScenarios.forEach(
      ({
        req,
        scenario,
        expectedPageRendered,
        context
      }: {
        req: any
        scenario: string;
        expectedPageRendered: string;
        context?: string;
      }) => {
        it(`should render ${expectedPageRendered} with context ${context} when given ${scenario}`, async () => {
          await middleware.handleJourneyPageRequest(req, res, next);

          const expectedArgs = [expectedPageRendered, ...(context ? [{context}] : [])]

          expect(res.render).to.have.been.calledWith(...expectedArgs);
        });
      },
    );

    it("should render attempt recovery error page when current page is not equal to pageId", async () => {
      const request = {...testReq, session: {...testReq.session, currentPage: "page-multiple-doc-check"}};

      await middleware.handleJourneyPageRequest(testReq, res, next);

      expect(res.redirect).to.have.been.calledWith(
        "/ipv/page/pyi-attempt-recovery",
      );
    });

    it("should raise an error when missing params", async () => {
      const req = {
        session: {
          ipvSessionId: "ipv-session-id",
          ipAddress: "ip-address",
          featureSet: "feature-set",
          save: sinon.fake.yields(null),
        },
      } as any;

      await middleware.handleJourneyPageRequest(req, res, next);

      expect(next).to.have.been.calledWith(sinon.match.instanceOf(Error));
    });

    it("should render pyi-technical page with 'unrecoverable' context if ipvSessionId is null", async () => {
      req.session.ipvSessionId = undefined;

      await middleware.handleJourneyPageRequest(req, res, next);

      expect(res.render).to.have.been.calledWith("ipv/page/pyi-technical.njk", {
        context: "unrecoverable",
      });
    });

    it("should render pyi-technical page with 'unrecoverable' context if ipvSessionId is undefined", async () => {
      delete req.session.ipvSessionId;

      await middleware.handleJourneyPageRequest(req, res, next);

      expect(res.render).to.have.been.calledWith("ipv/page/pyi-technical.njk", {
        context: "unrecoverable",
      });
    });
  });

  context("handle event response", async () => {
    const redirectUrl = "https://someurl.com";
    let eventResponses = [] as { data: PostJourneyEventResponse }[];
    const clientId = "test-client-id";
    const request =
      "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJkYXRlT2ZCaXJ0aHMiOltdLCJhZGRyZXNzZXMiOltdLCJuYW1lcyI6W10sImFkZHJlc3NIaXN0b3J5IjpbXX0.DwQQOldmOYQ1Lv6OJETzks7xv1fM7VzW0O01H3-uQqQ_rSkCZrd2KwQHHzo0Ddw2K_LreePy-tEr-tiPgi8Yl604n3rwQy6xBat8mb4lTtNnOxsUOYviYQxC5aamsvBAS27G43wFejearXHWzEqhJhIFdGE4zJkgZAKpLGzvOXLvX4NZM4aI4c6jMgpktkvvFey-O0rI5ePh5RU4BjbG_hvByKNlLr7pzIlsS-Q8KuIPawqFJxN2e3xfj1Ogr8zO0hOeDCA5dLDie78sPd8ph0l5LOOcGZskd-WD74TM6XeinVpyTfN7esYBnIZL-p-qULr9CUVIPCMxn-8VTj3SOw=="; // pragma: allowlist secret
    const responseType = "code";

    beforeEach(() => {
      req = {
        id: "1",
        body: { journey: "next" },
        session: {
          ipvSessionId: "ipv-session-id",
          ipAddress: "ip-address",
          currentPage: "page-ipv-identity-document-start",
          save: sinon.fake.yields(null),
        },
        log: { info: sinon.fake(), error: sinon.fake() },
        params: { pageId: "page-ipv-identity-document-start" },
      } as any;
    });

    afterEach(() => {
      sinon.restore();
    });

    it("should be redirected to a valid redirectURL given a valid CRI event response", async function () {
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

      const callBack = sinon.stub();
      coreBackServiceStub.postJourneyEvent = callBack;

      eventResponses.forEach((_, index) => {
        callBack.onCall(index).returns(eventResponses[index]);
      });

      await middleware.processAction(req, res, "next");
      expect(res.redirect).to.have.been.calledWith(
        `${redirectUrl}?client_id=${clientId}&request=${request}&response_type=${responseType}`,
      );
    });

    it("should raise an error given an empty redirectURl", async () => {
      eventResponses = [
        {
          data: {
            cri: {
              id: "someid",
              redirectUrl: ""
            },
          },
        },
      ];

      const callBack = sinon.stub();
      coreBackServiceStub.postJourneyEvent = callBack;

      eventResponses.forEach((_, index) => {
        callBack.onCall(index).returns(eventResponses[index]);
      });

      await middleware.handleJourneyActionRequest(req, res, next);
      expect(next).to.have.been.calledWith(
        sinon.match.has("message", "CRI response RedirectUrl is missing"),
      );
    });

    it("should be redirected to a valid Client URL given a valid Client event response", async function () {
      const redirectUrl = "https://someurl.org";
      const callBack = sinon.stub();

      coreBackServiceStub.postJourneyEvent = callBack;

      callBack.onCall(0).returns({
        data: { client: { redirectUrl: redirectUrl } },
      });

      req.session.clientOauthSessionId = "fake-client-session";
      await middleware.processAction(req, res, "next");
      expect(res.redirect).to.be.calledWith(`${redirectUrl}`);
      expect(req.session.clientOauthSessionId).to.be.undefined;
    });
  })

  context("handling identify-device page response", () => {
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
        headers: { "user-agent": "Not mobile device" },
      } as any;
    });

    it("should send an appTriage event to core-back and then handle the response", async function () {
      const pageId = PROVE_IDENTITY_NO_PHOTO_ID;
      const eventResponses = [
        {
          data: { page: IDENTIFY_DEVICE },
        },
        {
          data: { page: pageId },
        },
      ];

      const callBack = sinon.stub();
      coreBackServiceStub.postJourneyEvent = callBack;

      eventResponses.forEach((er, index) => {
        callBack.onCall(index).returns(eventResponses[index]);
      });

      //req.session.clientOauthSessionId = "fake-client-session";
      await middleware.processAction(req, res, "next");

      expect(
        coreBackServiceStub.postJourneyEvent.getCall(0),
      ).to.have.been.calledWith(req, "next");
      expect(
        coreBackServiceStub.postJourneyEvent.getCall(1),
      ).to.have.been.calledWith(req, "appTriage");

      expect(res.redirect).to.have.been.calledWith(`/ipv/page/${pageId}`);
    });
  });

  context("handling missing callBackUrl Client event response", () => {
    let eventResponses = [] as { data: any }[];

    const authCode = "ABC123";
    const state = "test-state";

    beforeEach(() => {
      eventResponses = [
        {
          data: {
            client: {
              redirectUrl: undefined,
              authCode: authCode,
              state: state,
            },
          },
        },
      ];

      req = {
        id: "1",
        url: "/journey/next",
        body: { journey: "next" },
        session: {
          ipvSessionId: "ipv-session-id",
          ipAddress: "ip-address",
          currentPage: "page-ipv-identity-document-start",
          save: sinon.fake.yields(null),
        },
        log: { info: sinon.fake(), error: sinon.fake() },
        params: { pageId: "page-ipv-identity-document-start" },
      } as any;

      const callBack = sinon.stub();
      coreBackServiceStub.postJourneyEvent = callBack;

      eventResponses.forEach((er, index) => {
        callBack.onCall(index).returns(eventResponses[index]);
      });
    });

    it("should call next with error message Redirect url is missing", async function () {
      await middleware.handleJourneyActionRequest(req, res, next);
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
          session: {
            ipvSessionId: "ipv-session-id",
            ipAddress: "ip-address",
            currentPage: "page-ipv-identity-document-start",
            save: sinon.fake.yields(null),
          },
          log: { info: sinon.fake(), error: sinon.fake() },
          params: { pageId: "page-ipv-identity-document-start" },
        } as any;

        await middleware.handleJourneyActionRequest(req, res, next);
        expect(
          coreBackServiceStub.postJourneyEvent.firstCall,
        ).to.have.been.calledWith(
          req,
          "end",
          "page-ipv-identity-document-start",
        );
      });

      it("should postJourneyEvent with attempt-recovery", async function () {
        req = {
          id: "1",
          body: { journey: "attempt-recovery" },
          session: {
            ipvSessionId: "ipv-session-id",
            ipAddress: "ip-address",
            currentPage: "page-ipv-identity-document-start",
            save: sinon.fake.yields(null),
          },
          log: { info: sinon.fake(), error: sinon.fake() },
          params: { pageId: "page-ipv-identity-document-start" },
        } as any;

        await middleware.handleJourneyActionRequest(req, res, next);
        expect(
          coreBackServiceStub.postJourneyEvent.firstCall,
        ).to.have.been.calledWith(
          req,
          "attempt-recovery",
          "page-ipv-identity-document-start",
        );
      });

      it("should postJourneyEvent with build-client-oauth-response and use ip address from header when not present in session", async function () {
        req = {
          id: "1",
          body: { journey: "build-client-oauth-response" },
          session: {
            ipvSessionId: "ipv-session-id",
            currentPage: "page-ipv-identity-document-start",
            save: sinon.fake.yields(null),
          },
          headers: { forwarded: "1.1.1.1" },
          log: { info: sinon.fake(), error: sinon.fake() },
          params: { pageId: "page-ipv-identity-document-start" },
        } as any;

        await middleware.handleJourneyActionRequest(req, res, next);
        expect(
          coreBackServiceStub.postJourneyEvent.firstCall,
        ).to.have.been.calledWith(
          req,
          "build-client-oauth-response",
          "page-ipv-identity-document-start",
        );
      });

      it("should postJourneyEvent with build-client-oauth-response and use ip address from session when it is present in session", async function () {
        req = {
          id: "1",
          body: { journey: "build-client-oauth-response" },
          session: {
            ipvSessionId: "ipv-session-id",
            ipAddress: "ip-address",
            currentPage: "page-ipv-identity-document-start",
            save: sinon.fake.yields(null),
          },
          headers: { forwarded: "1.1.1.1" },
          log: { info: sinon.fake(), error: sinon.fake() },
          params: { pageId: "page-ipv-identity-document-start" },
        } as any;

        await middleware.handleJourneyActionRequest(req, res, next);
        expect(
          coreBackServiceStub.postJourneyEvent.firstCall,
        ).to.have.been.calledWith(
          req,
          "build-client-oauth-response",
          "page-ipv-identity-document-start",
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
          save: sinon.fake.yields(null),
        },
        params: { pageId: "page-ipv-identity-document-start" },
        log: { info: sinon.fake(), error: sinon.fake() },
      } as any;

      await middleware.handleJourneyActionRequest(req, res, next);
      expect(res.status).to.have.been.calledWith(401);
      expect(res.render).to.have.been.calledWith("ipv/page/pyi-technical.njk", {
        context: "unrecoverable",
      });
    });
  });

  context("handling page-ipv-reuse journey route", () => {
    const pageId = "page-ipv-reuse";
    it("should call build-proven-user-identity-details endpoint and user details passed into renderer", async function () {
      const axiosResponse = {} as AxiosResponse;
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

      coreBackServiceStub.getProvenIdentityUserDetails =
        sinon.fake.returns(axiosResponse);

      req = {
        id: "1",
        params: { pageId: pageId },
        csrfToken: sinon.fake(),
        session: {
          currentPage: pageId,
          ipvSessionId: "a-session-id",
          save: sinon.fake.yields(null),
        },
        log: { info: sinon.fake(), error: sinon.fake() },
        i18n: { t: () => "Some label" },
      } as any;

      await middleware.handleJourneyPageRequest(req, res, next);

      expect(
        coreBackServiceStub.getProvenIdentityUserDetails.firstCall,
      ).to.have.been.calledWith(req);

      expect(res.render).to.have.been.calledWith(
        `ipv/page/${pageId}.njk`,
        sinon.match.has("userDetails", expectedUserDetail),
      );
    });

    it("should call build-proven-user-identity-details endpoint and user details passed into renderer with multiple given names", async function () {
      const axiosResponse = {} as AxiosResponse;
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

      coreBackServiceStub.getProvenIdentityUserDetails =
        sinon.fake.returns(axiosResponse);

      req = {
        id: "1",
        params: { pageId: pageId },
        csrfToken: sinon.fake(),
        session: {
          currentPage: pageId,
          ipvSessionId: "a-session-id",
          save: sinon.fake.yields(null),
        },
        log: { info: sinon.fake(), error: sinon.fake() },
        i18n: { t: () => "Some label" },
      } as any;

      await middleware.handleJourneyPageRequest(req, res, next);

      expect(
        coreBackServiceStub.getProvenIdentityUserDetails.firstCall,
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

  context("staticPageMiddleware", () => {
    it("should render static document type page", () => {
      const req = {} as any;
      const res = {
        render: sinon.spy(),
      } as any;
      const staticPageMiddleware = middleware.staticPageMiddleware(
        "page-ipv-identity-document-types",
      );
      staticPageMiddleware(req, res);

      expect(res.render).to.have.been.calledWith(
        "ipv/page/page-ipv-identity-document-types.njk",
      );
    });
  });

  context(
    "handleJourneyActionRequest: handling journey action with ukPassport, drivingLicence, end",
    () => {
      it("should postJourneyEvent with ukPassport", async function () {
        req = {
          id: "1",
          body: { journey: "ukPassport" },
          session: {
            ipvSessionId: "ipv-session-id",
            ipAddress: "ip-address",
            currentPage: "page-ipv-identity-document-start",
            save: sinon.fake.yields(null),
          },
          log: { info: sinon.fake(), error: sinon.fake() },
          params: { pageId: "page-ipv-identity-document-start" },
        } as any;

        await middleware.handleJourneyActionRequest(req, res, next);
        expect(
          coreBackServiceStub.postJourneyEvent.firstCall,
        ).to.have.been.calledWith(
          req,
          "ukPassport",
          "page-ipv-identity-document-start",
        );
      });

      it("should postJourneyEvent with drivingLicence", async function () {
        req = {
          id: "1",
          body: { journey: "drivingLicence" },
          session: {
            ipvSessionId: "ipv-session-id",
            ipAddress: "ip-address",
            currentPage: "page-ipv-identity-document-start",
            save: sinon.fake.yields(null),
          },
          log: { info: sinon.fake(), error: sinon.fake() },
          params: { pageId: "page-ipv-identity-document-start" },
        } as any;

        await middleware.handleJourneyActionRequest(req, res, next);
        expect(
          coreBackServiceStub.postJourneyEvent.firstCall,
        ).to.have.been.calledWith(
          req,
          "drivingLicence",
          "page-ipv-identity-document-start",
        );
      });
    },
  );

  context(
    "handleJourneyActionRequest: handling journey action events - 'contact', 'end'",
    () => {
      it("should postJourneyEvent with end", async function () {
        req = {
          id: "1",
          body: { journey: "end" },
          session: {
            ipvSessionId: "ipv-session-id",
            ipAddress: "ip-address",
            currentPage: "page-ipv-identity-document-start",
            save: sinon.fake.yields(null),
          },
          log: { info: sinon.fake(), error: sinon.fake() },
          params: { pageId: "page-ipv-identity-document-start" },
        } as any;

        await middleware.handleJourneyActionRequest(req, res, next);
        expect(
          coreBackServiceStub.postJourneyEvent.firstCall,
        ).to.have.been.calledWith(
          req,
          "end",
          "page-ipv-identity-document-start",
        );
      });

      it("should call saveAndRedirect given 'contact' event", async function () {
        req = {
          id: "1",
          body: { journey: "contact" },
          session: {
            ipvSessionId: "ipv-session-id",
            ipAddress: "ip-address",
            currentPage: "page-ipv-identity-document-start",
            save: sinon.fake.yields(null),
          },
          log: { info: sinon.fake(), error: sinon.fake() },
          params: { pageId: "page-ipv-identity-document-start" },
        } as any;

        await middleware.handleJourneyActionRequest(req, res, next);
        expect(res.redirect).to.have.been.calledWith("contactUrl");
      });

      it("should call saveAndRedirect given 'deleteAccount' event", async function () {
        req = {
          id: "1",
          body: { journey: "deleteAccount" },
          session: {
            ipvSessionId: "ipv-session-id",
            ipAddress: "ip-address",
            currentPage: "page-ipv-identity-document-start",
            save: sinon.fake.yields(null),
          },
          log: { info: sinon.fake(), error: sinon.fake() },
          params: { pageId: "page-ipv-identity-document-start" },
        } as any;

        await middleware.handleJourneyActionRequest(req, res, next);
        expect(res.redirect).to.have.been.calledWith("deleteAccount");
      });
    },
  );

  context(
    "handleJourneyActionRequest: handling journey action with next, bankAccount, end",
    () => {
      it("should postJourneyEvent with next", async function () {
        req = {
          id: "1",
          body: { journey: "next" },
          session: {
            ipvSessionId: "ipv-session-id",
            ipAddress: "ip-address",
            currentPage: "page-ipv-identity-document-start",
            save: sinon.fake.yields(null),
          },
          log: { info: sinon.fake(), error: sinon.fake() },
          params: { pageId: "page-ipv-identity-document-start" },
        } as any;

        await middleware.handleJourneyActionRequest(req, res, next);
        expect(
          coreBackServiceStub.postJourneyEvent.firstCall,
        ).to.have.been.calledWith(
          req,
          "next",
          "page-ipv-identity-document-start",
        );
      });

      it("should postJourneyEvent with bankAccount", async function () {
        req = {
          id: "1",
          body: { journey: "bankAccount" },
          session: {
            ipvSessionId: "ipv-session-id",
            ipAddress: "ip-address",
            currentPage: "page-ipv-identity-document-start",
            save: sinon.fake.yields(null),
          },
          log: { info: sinon.fake(), error: sinon.fake() },
          params: { pageId: "page-ipv-identity-document-start" },
        } as any;

        await middleware.handleJourneyActionRequest(req, res, next);
        expect(
          coreBackServiceStub.postJourneyEvent.firstCall,
        ).to.have.been.calledWith(
          req,
          "bankAccount",
          "page-ipv-identity-document-start",
        );
      });
    },
  );

  context(
    "handleJourneyActionRequest: handling missing ipvSessionId before calling the backend",
    () => {
      it("should render the technical unrecoverable page", async function () {
        req = {
          id: "1",
          session: {
            currentPage: "page-ipv-identity-document-start",
            ipvSessionId: null,
            ipAddress: "ip-address",
            save: sinon.fake.yields(null),
          },
          log: { info: sinon.fake(), error: sinon.fake() },
          params: { pageId: "page-ipv-identity-document-start" },
        } as any;

        await middleware.handleJourneyActionRequest(req, res, next);
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
    "handleJourneyActionRequest: handling journey action with f2f, dcmaw, end",
    () => {
      afterEach(() => {
        sinon.restore();
      });

      it("should postJourneyEvent with f2f", async function () {
        req = {
          id: "1",
          body: { journey: "f2f" },
          session: {
            ipvSessionId: "ipv-session-id",
            ipAddress: "ip-address",
            currentPage: "page-ipv-identity-document-start",
            save: sinon.fake.yields(null),
          },
          log: { info: sinon.fake(), error: sinon.fake() },
          params: { pageId: "page-ipv-identity-document-start" },
        } as any;

        await middleware.handleJourneyActionRequest(req, res, next);
        expect(
          coreBackServiceStub.postJourneyEvent.firstCall,
        ).to.have.been.calledWith(
          req,
          "f2f",
          "page-ipv-identity-document-start",
        );
      });

      it("should postJourneyEvent with dcmaw", async function () {
        req = {
          id: "1",
          body: { journey: "dcmaw" },
          session: {
            ipvSessionId: "ipv-session-id",
            ipAddress: "ip-address",
            currentPage: "page-ipv-identity-document-start",
            save: sinon.fake.yields(null),
          },
          log: { info: sinon.fake(), error: sinon.fake() },
          params: { pageId: "page-ipv-identity-document-start" },
        } as any;

        await middleware.handleJourneyActionRequest(req, res, next);
        expect(
          coreBackServiceStub.postJourneyEvent.firstCall,
        ).to.have.been.calledWith(
          req,
          "dcmaw",
          "page-ipv-identity-document-start",
        );
      });
    },
  );

  context(
    "handleJourneyActionRequest: handling missing ipvSessionId before calling the backend",
    () => {
      it("should render the technical unrecoverable page", async function () {
        req = {
          id: "1",
          session: {
            currentPage: "page-ipv-identity-document-start",
            ipvSessionId: null,
            ipAddress: "ip-address",
            save: sinon.fake.yields(null),
          },
          params: { pageId: "page-ipv-identity-document-start" },
          log: { info: sinon.fake(), error: sinon.fake() },
        } as any;

        await middleware.handleJourneyActionRequest(req, res, next);
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
    "handleJourneyActionRequest: handling missing ipv session and oauth id before calling the backend",
    () => {
      it("should render the technical unrecoverable page", async function () {
        req = {
          id: "1",
          session: {
            currentPage: "pyi-suggest-other-options",
            ipvSessionId: null,
            ipAddress: "ip-address",
            save: sinon.fake.yields(null),
          },
          params: { pageId: "pyi-suggest-other-options" },
          log: { info: sinon.fake(), error: sinon.fake() },
        } as any;

        await middleware.handleJourneyActionRequest(req, res, next);
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
      } as Request;
      res = {} as Response;
      next = sinon.stub() as any;
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

  context("checkFormRadioButtonSelected middleware", () => {
    beforeEach(() => {
      req = {
        body: {},
        params: { pageId: "page-ipv-identity-document-start" },
        csrfToken: sinon.fake(),
        session: {
          currentPage: "page-ipv-identity-document-start",
          ipvSessionId: "ipv-session-id",
          save: sinon.fake.yields(null),
        },
        log: { error: sinon.fake() },
      } as any;
    });

    it("should render if journey is not defined", async function () {
      req.body.journey = undefined;
      await middleware.checkFormRadioButtonSelected(req, res, next);

      expect(res.render).to.have.been.called;
      expect(next).to.have.not.been.calledOnce;
    });

    it("should not render if journey is defined", async function () {
      req.body.journey = "someJourney";
      await middleware.checkFormRadioButtonSelected(req, res, next);

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
          save: sinon.fake.yields(null),
        },
        csrfToken: sinon.fake(),
        log: { info: sinon.fake(), error: sinon.fake() },
      } as any;
    });

    it("sets an iPhone qrCode value for the page", async function () {
      req.method = "GET";
      req.session.context = "iphone";
      const qrCodeUrl =
        config.SERVICE_URL + "/ipv/app-redirect/" + PHONE_TYPES.IPHONE;
      const expectedQrCodeData =
        await qrCodeHelper.generateQrCodeImageData(qrCodeUrl);

      await middleware.handleJourneyPageRequest(req, res, next);

      expect(res.render).to.have.been.calledWith(
        `ipv/page/pyi-triage-desktop-download-app.njk`,
        sinon.match.has("qrCode", expectedQrCodeData),
      );
    });

    it("sets an Android qrCode value for the page", async function () {
      req.method = "GET";
      req.session.context = "android";
      const qrCodeUrl =
        config.SERVICE_URL + "/ipv/app-redirect/" + PHONE_TYPES.ANDROID;
      const expectedQrCodeData =
        await qrCodeHelper.generateQrCodeImageData(qrCodeUrl);

      await middleware.handleJourneyPageRequest(req, res, next);

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
          save: sinon.fake.yields(null),
        },
        csrfToken: sinon.fake(),
        log: { info: sinon.fake(), error: sinon.fake() },
      } as any;
    });

    it("sets an Android appDownloadUrl value for the page", async function () {
      req.method = "GET";
      req.session.context = "android";

      await middleware.handleJourneyPageRequest(req, res, next);

      expect(res.render).to.have.been.calledWith(
        `ipv/page/pyi-triage-mobile-download-app.njk`,
        sinon.match.has(
          "appDownloadUrl",
          config.SERVICE_URL + "/ipv/app-redirect/" + PHONE_TYPES.ANDROID,
        ),
      );
    });

    it("sets an iPhone appDownloadUrl value for the page", async function () {
      req.method = "GET";
      req.session.context = "iphone";

      await middleware.handleJourneyPageRequest(req, res, next);

      expect(res.render).to.have.been.calledWith(
        `ipv/page/pyi-triage-mobile-download-app.njk`,
        sinon.match.has(
          "appDownloadUrl",
          config.SERVICE_URL + "/ipv/app-redirect/" + PHONE_TYPES.IPHONE,
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
        session: {
          save: sinon.fake.yields(null),
        },
      } as any;
    });

    it("redirects to the apple store if the user said they have an iphone", async function () {
      req.params.specifiedPhoneType = PHONE_TYPES.IPHONE;
      req.method = "GET";
      await middleware.handleAppStoreRedirect(req, res, next);

      expect(res.redirect).to.have.been.calledWith(config.APP_STORE_URL_APPLE);
    });

    it("redirects to the android store if the user said they have an android", async function () {
      req.params.specifiedPhoneType = PHONE_TYPES.ANDROID;
      req.method = "GET";
      await middleware.handleAppStoreRedirect(req, res, next);

      expect(res.redirect).to.have.been.calledWith(
        config.APP_STORE_URL_ANDROID,
      );
    });

    it("throws an error for a bad phone type", async function () {
      req.params.specifiedPhoneType = "notaphone";
      req.method = "GET";
      await middleware.handleAppStoreRedirect(req, res, next);

      expect(next).to.be.calledWith(sinon.match.instanceOf(Error));
    });
  });

  context("handle unknown backend response", () => {
    let eventResponses = [] as { data: any }[];
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
        session: {
          ipvSessionId: "ipv-session-id",
          ipAddress: "ip-address",
          save: sinon.fake.yields(null),
        },
        log: { info: sinon.fake(), error: sinon.fake() },
      } as any;

      const callBack = sinon.stub();
      coreBackServiceStub.postAction = callBack;

      eventResponses.forEach((er, index) => {
        callBack.onCall(index).returns(eventResponses[index]);
      });
    });

    afterEach(() => {
      sinon.restore();
    });

    it("should throw an error when receiving an unexpected backend response", async function () {
      expect(
        middleware.processAction(req, res, "/journey/next"),
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
      } as any;
    });

    describe("valid combinations of details to update", () => {
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
        expect(req.body.journey).to.equal(SUPPORTED_COMBO_EVENTS.UPDATE_CANCEL);
      });

      it("should set journey to undefined if detailsToUpdate is cancel and address", async function () {
        req.body.detailsToUpdate = ["cancel", "address"];
        await middleware.formHandleUpdateDetailsCheckBox(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal(undefined);
      });

      it("should set journey to UPDATE_GIVEN_NAMES if detailsToUpdate is givenNames", async function () {
        req.body.detailsToUpdate = "givenNames";
        await middleware.formHandleUpdateDetailsCheckBox(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal(
          SUPPORTED_COMBO_EVENTS.UPDATE_GIVEN_NAMES,
        );
      });

      it("should set journey to UPDATE_FAMILY_NAME if detailsToUpdate is lastName", async function () {
        req.body.detailsToUpdate = ["familyName"];
        await middleware.formHandleUpdateDetailsCheckBox(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal(
          SUPPORTED_COMBO_EVENTS.UPDATE_FAMILY_NAME,
        );
      });

      it("should set journey to UPDATE_ADDRESS if detailsToUpdate is address", async function () {
        req.body.detailsToUpdate = "address";
        await middleware.formHandleUpdateDetailsCheckBox(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal(
          SUPPORTED_COMBO_EVENTS.UPDATE_ADDRESS,
        );
      });

      it("should set journey to UPDATE_GIVEN_NAME_ADDRESS if detailsToUpdate is givenNames and address", async function () {
        req.body.detailsToUpdate = ["givenNames", "address"];
        await middleware.formHandleUpdateDetailsCheckBox(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal(
          SUPPORTED_COMBO_EVENTS.UPDATE_GIVEN_NAMES_ADDRESS,
        );
      });

      it("should set journey to UPDATE_FAMILY_NAME_ADDRESS if detailsToUpdate is lastName and address", async function () {
        req.body.detailsToUpdate = ["familyName", "address"];
        await middleware.formHandleUpdateDetailsCheckBox(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal(
          SUPPORTED_COMBO_EVENTS.UPDATE_FAMILY_NAME_ADDRESS,
        );
      });
    });

    describe("invalid combinations of details to update", () => {
      it("should set journey to dob if detailsToUpdate is dateOfBirth", async function () {
        req.body.detailsToUpdate = ["dateOfBirth"];
        await middleware.formHandleUpdateDetailsCheckBox(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal("dob");
      });
      it("should set journey to dob-given if detailsToUpdate is dateOfBirth and givenNames", async function () {
        req.body.detailsToUpdate = ["dateOfBirth", "givenNames"];
        await middleware.formHandleUpdateDetailsCheckBox(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal("dob-given");
      });
      it("should set journey to dob-family if detailsToUpdate is dateOfBirth and familyName", async function () {
        req.body.detailsToUpdate = ["dateOfBirth", "familyName"];
        await middleware.formHandleUpdateDetailsCheckBox(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal("dob-family");
      });
      it("should set journey to address-dob if detailsToUpdate is dateOfBirth and address", async function () {
        req.body.detailsToUpdate = ["dateOfBirth", "address"];
        await middleware.formHandleUpdateDetailsCheckBox(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal("address-dob");
      });
      it("should set journey to dob-family-given if detailsToUpdate is dateOfBirth, givenNames and familyName", async function () {
        req.body.detailsToUpdate = ["dateOfBirth", "givenNames", "familyName"];
        await middleware.formHandleUpdateDetailsCheckBox(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal("dob-family-given");
      });
      it("should set journey to address-dob-given if detailsToUpdate is dateOfBirth, address and givenNames", async function () {
        req.body.detailsToUpdate = ["dateOfBirth", "address", "givenNames"];
        await middleware.formHandleUpdateDetailsCheckBox(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal("address-dob-given");
      });
      it("should set journey to address-dob-family if detailsToUpdate is dateOfBirth, address and familyName", async function () {
        req.body.detailsToUpdate = ["dateOfBirth", "address", "familyName"];
        await middleware.formHandleUpdateDetailsCheckBox(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal("address-dob-family");
      });
      it("should set journey to address-dob-family-given if detailsToUpdate is dateOfBirth, address, givenNames and familyName", async function () {
        req.body.detailsToUpdate = [
          "dateOfBirth",
          "address",
          "givenNames",
          "familyName",
        ];
        await middleware.formHandleUpdateDetailsCheckBox(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal("address-dob-family-given");
      });
      it("should set journey to family-given if detailsToUpdate is givenNames and familyName", async function () {
        req.body.detailsToUpdate = ["givenNames", "familyName"];
        await middleware.formHandleUpdateDetailsCheckBox(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal("family-given");
      });
      it("should set journey to address-family-given if detailsToUpdate is address, givenNames, familyName", async function () {
        req.body.detailsToUpdate = ["address", "givenNames", "familyName"];
        await middleware.formHandleUpdateDetailsCheckBox(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal("address-family-given");
      });
    });
  });

  context("formHandleCoiDetailsCheck middleware", () => {
    beforeEach(() => {
      req = {
        body: {},
        params: { pageId: "confirm-your-details" },
        csrfToken: sinon.fake(),
        session: {
          context: "coi",
          currentPage: "confirm-your-details",
          save: sinon.fake.yields(null),
        },
        log: { error: sinon.fake() },
      } as any;
    });

    it("should set journey to next if detailsCorrect is yes", async function () {
      req.body.detailsToUpdate = [];
      req.body.detailsCorrect = "yes";
      await middleware.formHandleCoiDetailsCheck(req, res, next);
      expect(next).to.have.been.calledOnce;
      expect(req.body.journey).to.equal("next");
    });
    it("should set the correct error if detailsCorrect is empty and detailsToUpdate is empty", async function () {
      coreBackServiceStub.getProvenIdentityUserDetails = sinon.fake.returns({});
      await middleware.formHandleCoiDetailsCheck(req, res, next);

      expect(coreBackServiceStub.getProvenIdentityUserDetails).to.have.been
        .called;
      expect(next).to.not.have.been.called;
      expect(res.render).to.have.been.calledWith(
        "ipv/page/confirm-your-details.njk",
        {
          context: "coi",
          errorState: "radiobox",
          pageId: "confirm-your-details",
          csrfToken: undefined,
          userDetails: undefined,
        },
      );
    });
    it("should set the correct error if detailsCorrect is no and detailsToUpdate is empty", async function () {
      coreBackServiceStub.getProvenIdentityUserDetails = sinon.fake.resolves(
        {},
      );
      req.body.detailsToUpdate = "";
      req.body.detailsCorrect = "no";
      await middleware.formHandleCoiDetailsCheck(req, res, next);

      expect(coreBackServiceStub.getProvenIdentityUserDetails).to.have.been
        .called;
      expect(next).to.not.have.been.called;
      expect(res.render).to.have.been.calledWith(
        "ipv/page/confirm-your-details.njk",
        {
          context: "coi",
          errorState: "checkbox",
          pageId: "confirm-your-details",
          csrfToken: undefined,
          userDetails: undefined,
        },
      );
    });

    describe("valid combinations of attributes", () => {
      it("should set correct journey if detailsCorrect is no and detailsToUpdate is address", async function () {
        req.body.detailsToUpdate = "address";
        req.body.detailsCorrect = "no";
        await middleware.formHandleCoiDetailsCheck(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal("address-only");
      });

      it("should set correct journey if detailsCorrect is no and detailsToUpdate is givenNames", async function () {
        req.body.detailsToUpdate = ["givenNames"];
        req.body.detailsCorrect = "no";
        await middleware.formHandleCoiDetailsCheck(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal("given-names-only");
      });

      it("should set correct journey if detailsCorrect is no and detailsToUpdate is familyName", async function () {
        req.body.detailsToUpdate = ["familyName"];
        req.body.detailsCorrect = "no";
        await middleware.formHandleCoiDetailsCheck(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal("family-name-only");
      });

      it("should set correct journey if detailsCorrect is no and detailsToUpdate is givenNames and address", async function () {
        req.body.detailsToUpdate = ["givenNames", "address"];
        req.body.detailsCorrect = "no";
        await middleware.formHandleCoiDetailsCheck(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal("given-names-and-address");
      });
      it("should set correct journey if detailsCorrect is no and detailsToUpdate is familyName and address", async function () {
        req.body.detailsToUpdate = ["familyName", "address"];
        req.body.detailsCorrect = "no";
        await middleware.formHandleCoiDetailsCheck(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal("family-name-and-address");
      });
    });

    describe("invalid combinations of attributes", () => {
      it("should set correct journey if detailsCorrect is no and detailsToUpdate is dateOfBirth", async function () {
        req.body.detailsToUpdate = ["dateOfBirth"];
        req.body.detailsCorrect = "no";
        await middleware.formHandleCoiDetailsCheck(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal("dob");
      });

      it("should set correct journey if detailsCorrect is no and detailsToUpdate is dateOfBirth and givenNames", async function () {
        req.body.detailsToUpdate = ["dateOfBirth", "givenNames"];
        req.body.detailsCorrect = "no";
        await middleware.formHandleCoiDetailsCheck(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal("dob-given");
      });

      it("should set correct journey if detailsCorrect is no and detailsToUpdate is dateOfBirth and familyName", async function () {
        req.body.detailsToUpdate = ["dateOfBirth", "familyName"];
        req.body.detailsCorrect = "no";
        await middleware.formHandleCoiDetailsCheck(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal("dob-family");
      });

      it("should set correct journey if detailsCorrect is no and detailsToUpdate is dateOfBirth and address", async function () {
        req.body.detailsToUpdate = ["dateOfBirth", "address"];
        req.body.detailsCorrect = "no";
        await middleware.formHandleCoiDetailsCheck(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal("address-dob");
      });

      it("should set correct journey if detailsCorrect is no and detailsToUpdate is dateOfBirth, givenNames and familyName", async function () {
        req.body.detailsToUpdate = ["dateOfBirth", "givenNames", "familyName"];
        req.body.detailsCorrect = "no";
        await middleware.formHandleCoiDetailsCheck(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal("dob-family-given");
      });

      it("should set correct journey if detailsCorrect is no and detailsToUpdate is dateOfBirth, address and givenNames", async function () {
        req.body.detailsToUpdate = ["dateOfBirth", "address", "givenNames"];
        req.body.detailsCorrect = "no";
        await middleware.formHandleCoiDetailsCheck(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal("address-dob-given");
      });

      it("should set correct journey if detailsCorrect is no and detailsToUpdate is dateOfBirth, address and familyName", async function () {
        req.body.detailsToUpdate = ["dateOfBirth", "address", "familyName"];
        req.body.detailsCorrect = "no";
        await middleware.formHandleCoiDetailsCheck(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal("address-dob-family");
      });

      it("should set correct journey if detailsCorrect is no and detailsToUpdate is dateOfBirth, address, givenNames and familyName", async function () {
        req.body.detailsToUpdate = [
          "dateOfBirth",
          "address",
          "givenNames",
          "familyName",
        ];
        req.body.detailsCorrect = "no";
        await middleware.formHandleCoiDetailsCheck(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal("address-dob-family-given");
      });

      it("should set correct journey if detailsCorrect is no and detailsToUpdate is givenNames, familyName", async function () {
        req.body.detailsToUpdate = ["familyName", "givenNames"];
        req.body.detailsCorrect = "no";
        await middleware.formHandleCoiDetailsCheck(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal("family-given");
      });

      it("should set correct journey if detailsCorrect is no and detailsToUpdate is givenNames, familyName, address", async function () {
        req.body.detailsToUpdate = ["address", "familyName", "givenNames"];
        req.body.detailsCorrect = "no";
        await middleware.formHandleCoiDetailsCheck(req, res, next);
        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal("address-family-given");
      });
    });

    it("should set correct journey if detailsCorrect is yes and detailsToUpdate is not empty", async function () {
      req.body.detailsToUpdate = ["familyName", "givenNames"];
      req.body.detailsCorrect = "yes";
      await middleware.formHandleCoiDetailsCheck(req, res, next);
      expect(next).to.have.been.calledOnce;
      expect(req.body.journey).to.equal("next");
    });
    it("should not get user details if the page does not require it", async function () {
      coreBackServiceStub.getProvenIdentityUserDetails = sinon.fake.returns({});
      req.session.currentPage = "check-name-date-birth";
      req.session.context = undefined;
      await middleware.formHandleCoiDetailsCheck(req, res, next);

      expect(coreBackServiceStub.getProvenIdentityUserDetails).to.not.have.been
        .called;
      expect(next).to.not.have.been.called;
      expect(res.render).to.have.been.calledWith(
        "ipv/page/check-name-date-birth.njk",
        {
          errorState: "radiobox",
          pageId: "check-name-date-birth",
          csrfToken: undefined,
          context: undefined,
        },
      );
    });
  });
});
