import { NextFunction } from "express";
import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";
import { AxiosResponse } from "axios";

describe("handleJourneyPageResponse", () => {
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
    i18n: { t: () => "Some label" },
  } as any;

  const res = {
    status: sinon.fake(),
    redirect: sinon.fake(),
    send: sinon.fake(),
    render: sinon.fake(),
    log: { info: sinon.fake(), error: sinon.fake() },
    locals: { contactUsUrl: "contactUrl", deleteAccountUrl: "deleteAccount" },
  } as any;
  let next: NextFunction;

  const coreBackServiceStub = {
    getProvenIdentityUserDetails: sinon.spy(),
  };

  const middleware: typeof import("../middleware") = proxyquire(
    "../middleware",
    {
      "../../services/coreBackService": coreBackServiceStub,
    },
  );

  beforeEach(() => {
    res.render = sinon.fake();
    next = sinon.fake() as any;
    coreBackServiceStub.getProvenIdentityUserDetails = sinon.spy();
  });

  context("handling page-ipv-reuse journey route", () => {
    const nameTestCases = [
      {
        scenario: "single given name",
        nameAxiosResponse: {
          name: "firstName LastName",
          nameParts: [
            { type: "GivenName", value: "firstName" },
            { type: "FamilyName", value: "LastName" },
          ],
        },
        expectedNameUserDetails: {
          name: "firstName LastName",
          nameParts: {
            givenName: "firstName",
            familyName: "LastName",
          },
        },
      },
      {
        scenario: "multiple given name",
        nameAxiosResponse: {
          name: "firstName MiddleName LastName",
          nameParts: [
            { type: "GivenName", value: "firstName" },
            { type: "GivenName", value: "MiddleName" },
            { type: "FamilyName", value: "LastName" },
          ],
        },
        expectedNameUserDetails: {
          name: "firstName MiddleName LastName",
          nameParts: {
            givenName: "firstName MiddleName",
            familyName: "LastName",
          },
        },
      },
    ];
    nameTestCases.forEach(
      ({ scenario, nameAxiosResponse, expectedNameUserDetails }) => {
        it(`should call build-proven-user-identity-details endpoint and user details passed into renderer given ${scenario}`, async () => {
          const axiosResponse = {
            status: 200,
            data: {
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
              ...nameAxiosResponse,
            },
          } as AxiosResponse;

          const expectedUserDetail = {
            dateOfBirth: "01 11 1973",
            addresses: [
              {
                label: "Some label",
                addressDetailHtml:
                  "My deparment, My company, Room 5, my building<br>1 My outter street my inner street<br>My double dependant town my dependant town my town<br>myCode",
              },
            ],
            ...expectedNameUserDetails,
          };

          coreBackServiceStub.getProvenIdentityUserDetails =
            sinon.fake.returns(axiosResponse);

          const req = {
            ...testReq,
            params: { pageId: "page-ipv-reuse" },
            session: { ...testReq.session, currentPage: "page-ipv-reuse" },
          };

          await middleware.handleJourneyPageRequest(req, res, next);

          expect(
            coreBackServiceStub.getProvenIdentityUserDetails.firstCall,
          ).to.have.been.calledWith(req);

          expect(res.render).to.have.been.calledWith(
            `ipv/page/page-ipv-reuse.njk`,
            sinon.match.has("userDetails", expectedUserDetail),
          );
        });
      },
    );
  });

  it("should render page case when given valid pageId", async () => {
    const req = {
      ...testReq,
      params: { ...testReq.params, pageId: "prove-identity-no-photo-id" },
    };
    await middleware.handleJourneyPageRequest(req, res, next);

    expect(res.render).to.have.been.calledWith(
      "ipv/page/prove-identity-no-photo-id.njk",
    );
  });

  it("should set the response status code from a value in the session if present", async () => {
    const request = {
      ...testReq,
      session: { ...testReq.session, currentPageStatusCode: 418 },
    };

    await middleware.handleJourneyPageRequest(request, res, next);

    expect(res.render).to.have.been.calledWith(
      "ipv/page/prove-identity-no-photo-id.njk",
    );
    expect(res.status).to.have.been.calledWith(418);
    expect(testReq.session.currentPageStatusCode).to.equal(undefined);
  });

  const errorPageScenarios = [
    {
      req: {
        ...testReq,
        params: { ...testReq.params, pageId: "invalid-page" },
      },
      scenario: "invalid page id",
      expectedPageRendered: "errors/page-not-found.njk",
    },
    {
      req: {
        ...testReq,
        params: { ...testReq.params, pageId: "pyi-timeout-unrecoverable" },
      },
      scenario: "unrecoverable timeout pageId",
      expectedPageRendered: "ipv/page/pyi-timeout-unrecoverable.njk",
    },
    {
      req: {
        ...testReq,
        session: { ...testReq.session, ipvSessionId: null },
      },
      scenario: "ipvSessionId is null",
      expectedPageRendered: "ipv/page/pyi-technical.njk",
      context: "unrecoverable",
    },
    {
      req: {
        ...testReq,
        session: { ...testReq.session, ipvSessionId: undefined },
      },
      scenario: "ipvSessionId is undefined",
      expectedPageRendered: "ipv/page/pyi-technical.njk",
      context: "unrecoverable",
    },
  ];
  errorPageScenarios.forEach(
    ({
      req,
      scenario,
      expectedPageRendered,
      context,
    }: {
      req: any;
      scenario: string;
      expectedPageRendered: string;
      context?: string;
    }) => {
      it(`should render ${expectedPageRendered} with context ${context} when given ${scenario}`, async () => {
        await middleware.handleJourneyPageRequest(req, res, next);

        const expectedArgs = [
          expectedPageRendered,
          ...(context ? [{ context }] : []),
        ];

        expect(res.render).to.have.been.calledWith(...expectedArgs);
      });
    },
  );

  it("should render attempt recovery error page when current page is not equal to pageId", async () => {
    const request = {
      ...testReq,
      session: { ...testReq.session, currentPage: "page-multiple-doc-check" },
    };

    await middleware.handleJourneyPageRequest(request, res, next);

    expect(res.redirect).to.have.been.calledWith(
      "/ipv/page/pyi-attempt-recovery",
    );
  });

  it("should raise an error when missing params", async () => {
    const req = { ...testReq, params: undefined } as any;
    await middleware.handleJourneyPageRequest(req, res, next);

    expect(next).to.have.been.calledWith(sinon.match.instanceOf(Error));
  });
});
