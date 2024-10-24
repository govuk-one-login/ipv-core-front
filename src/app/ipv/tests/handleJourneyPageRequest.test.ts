import { NextFunction } from "express";
import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";
import { AxiosResponse } from "axios";
import NotFoundError from "../../../errors/not-found-error";
import TechnicalError from "../../../errors/technical-error";

describe("handleJourneyPageRequest", () => {
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
    log: { info: sinon.fake(), error: sinon.fake(), warn: sinon.fake() },
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
    it("should call build-proven-user-identity-details endpoint and user details passed into renderer", async () => {
      const axiosResponse = {
        status: 200,
        data: {
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
        },
      } as AxiosResponse;

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
      expectedError: NotFoundError,
    },
    {
      req: {
        ...testReq,
        session: { ...testReq.session, ipvSessionId: null },
      },
      scenario: "ipvSessionId is null",
      expectedError: TechnicalError,
    },
    {
      req: {
        ...testReq,
        session: { ...testReq.session, ipvSessionId: undefined },
      },
      scenario: "ipvSessionId is undefined",
      expectedError: TechnicalError,
    },
  ];
  errorPageScenarios.forEach(
    ({
      req,
      scenario,
      expectedError,
    }) => {
      it(`should throw ${expectedError.name} when given ${scenario}`, async () => {
        await middleware.handleJourneyPageRequest(req, res, next);

        expect(next).to.have.been.calledWith(
          sinon.match.instanceOf(expectedError),
        );
      });
    },
  );

  it("should redirect to attempt recovery page when current page is not equal to pageId", async () => {
    const request = {
      ...testReq,
      session: { ...testReq.session, currentPage: "page-multiple-doc-check" },
    };

    await middleware.handleJourneyPageRequest(request, res, next);

    expect(res.redirect).to.have.been.calledWith(
      "/ipv/page/pyi-attempt-recovery",
    );
    expect(request.session.currentPage).to.equal("pyi-attempt-recovery");
  });

  it("should render timeout unrecoverable even if current page is not equal to pageId", async () => {
    const request = {
      ...testReq,
      params: { ...testReq.params, pageId: "pyi-timeout-unrecoverable" },
    };

    await middleware.handleJourneyPageRequest(request, res, next);

    expect(res.render).to.have.been.calledWith(
      "ipv/page/pyi-timeout-unrecoverable.njk",
    );
  });

  it("should raise an error when missing params", async () => {
    const req = { ...testReq, params: undefined } as any;
    await middleware.handleJourneyPageRequest(req, res, next);

    expect(next).to.have.been.calledWith(sinon.match.instanceOf(Error));
  });
});
