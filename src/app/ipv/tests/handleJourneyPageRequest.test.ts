import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";
import { HttpStatusCode } from "axios";
import NotFoundError from "../../../errors/not-found-error";
import UnauthorizedError from "../../../errors/unauthorized-error";
import {
  specifyCreateRequest,
  specifyCreateResponse,
} from "../../../test-utils/mock-express";
import IPV_PAGES from "../../../constants/ipv-pages";

describe("handleJourneyPageRequest", () => {
  // Mock handler parameters
  const createRequest = specifyCreateRequest({
    session: {
      ipvSessionId: "ipv-session-id",
      ipAddress: "ip-address",
      save: sinon.fake.yields(null),
    },
  });
  const createResponse = specifyCreateResponse();
  const next: any = sinon.fake();

  // Setup stubs
  const coreBackServiceStub = { getProvenIdentityUserDetails: sinon.fake() };
  const middleware: typeof import("../middleware") = proxyquire(
    "../middleware",
    {
      "../../services/coreBackService": coreBackServiceStub,
    },
  );

  beforeEach(() => {
    next.resetHistory();
    coreBackServiceStub.getProvenIdentityUserDetails.resetHistory();
  });

  context("handling page-ipv-reuse journey route", () => {
    it("should call build-proven-user-identity-details endpoint and user details passed into renderer", async () => {
      // Arrange
      const req = createRequest({
        params: { pageId: "page-ipv-reuse" },
        session: { currentPage: "page-ipv-reuse" },
      });
      const res = createResponse();
      coreBackServiceStub.getProvenIdentityUserDetails = sinon.fake.resolves({
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
              addressRegion: "myRegion",
            },
          ],
        },
      });

      // Act
      await middleware.handleJourneyPageRequest(req, res, next);

      // Assert
      expect(
        coreBackServiceStub.getProvenIdentityUserDetails.firstCall,
      ).to.have.been.calledWith(req);
      expect(res.render).to.have.been.calledWith(
        `ipv/page/page-ipv-reuse.njk`,
        sinon.match.has("userDetails", {
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
                "My deparment, My company, Room 5, my building<br>1 My outter street my inner street<br>My double dependant town my dependant town my town myRegion<br>myCode",
            },
          ],
        }),
      );
    });
  });

  it("should render page case when given valid pageId", async () => {
    // Arrange
    const req = createRequest({
      params: { pageId: "prove-identity-no-photo-id" },
      session: { currentPage: "prove-identity-no-photo-id" },
    });
    const res = createResponse();

    // Act
    await middleware.handleJourneyPageRequest(req, res, next);

    // Assert
    expect(res.render).to.have.been.calledWith(
      "ipv/page/prove-identity-no-photo-id.njk",
    );
  });

  it("should render page with render options when given valid pageId", async () => {
    // Arrange
    const req = createRequest({
      params: { pageId: IPV_PAGES.PAGE_FACE_TO_FACE_HANDOFF },
      session: { currentPage: IPV_PAGES.PAGE_FACE_TO_FACE_HANDOFF },
    });
    const res = createResponse();

    // Act
    await middleware.handleJourneyPageRequest(req, res, next);

    // Assert
    expect(res.render).to.have.been.calledWith(
      "ipv/page/page-face-to-face-handoff.njk",
      {
        pageId: "page-face-to-face-handoff",
        csrfToken: undefined,
        context: undefined,
        pageErrorState: undefined,
        postOfficeVisitByDate: sinon.match.number,
      },
    );
  });

  it("should set the response status code from a value in the session if present", async () => {
    // Arrange
    const req = createRequest({
      params: { pageId: "prove-identity-no-photo-id" },
      session: {
        currentPage: "prove-identity-no-photo-id",
        currentPageStatusCode: HttpStatusCode.ImATeapot,
      },
    });
    const res = createResponse();

    // Act
    await middleware.handleJourneyPageRequest(req, res, next);

    // Assert
    expect(res.render).to.have.been.calledWith(
      "ipv/page/prove-identity-no-photo-id.njk",
    );
    expect(res.status).to.have.been.calledWith(HttpStatusCode.ImATeapot);
    expect(req.session.currentPageStatusCode).to.equal(undefined);
  });

  [
    {
      req: createRequest({
        params: { pageId: "invalid-page" },
      }),
      scenario: "invalid page id",
      expectedError: NotFoundError,
    },
    {
      req: createRequest({
        params: { pageId: "prove-identity-no-photo-id" },
        session: { ipvSessionId: undefined },
      }),
      scenario: "ipvSessionId is undefined",
      expectedError: UnauthorizedError,
    },
  ].forEach(({ req, scenario, expectedError }) => {
    it(`should throw ${expectedError.name} when given ${scenario}`, async () => {
      // Arrange
      const res = createResponse();

      // Act
      await middleware.handleJourneyPageRequest(req, res, next);

      // Assert
      expect(next).to.have.been.calledWith(
        sinon.match.instanceOf(expectedError),
      );
    });
  });

  it("should redirect to attempt recovery page when current page is not equal to pageId", async () => {
    // Arrange
    const req = createRequest({
      params: { pageId: "prove-identity-no-photo-id" },
      session: { currentPage: "page-multiple-doc-check" },
    });
    const res = createResponse();

    // Act
    await middleware.handleJourneyPageRequest(req, res, next);

    // Assert
    expect(res.redirect).to.have.been.calledWith(
      "/ipv/page/pyi-attempt-recovery",
    );
    expect(req.session.currentPage).to.equal("pyi-attempt-recovery");
  });

  it("should render timeout unrecoverable even if current page is not equal to pageId", async () => {
    // Arrange
    const req = createRequest({
      params: { pageId: "pyi-timeout-unrecoverable" },
    });
    const res = createResponse();

    // Act
    await middleware.handleJourneyPageRequest(req, res, next);

    // Assert
    expect(res.render).to.have.been.calledWith(
      "ipv/page/pyi-timeout-unrecoverable.njk",
    );
  });

  it("should raise an error when missing params", async () => {
    // Arrange
    const req = createRequest({
      params: undefined,
    });
    const res = createResponse();

    // Act
    await middleware.handleJourneyPageRequest(req, res, next);

    // Assert
    expect(next).to.have.been.calledWith(sinon.match.instanceOf(Error));
  });
});
