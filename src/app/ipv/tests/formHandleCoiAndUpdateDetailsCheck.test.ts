import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";
import {
  specifyCreateRequest,
  specifyCreateResponse,
} from "../../../test-utils/mock-express";

describe("handle update details/COI form checkbox", () => {
  // Mock handler parameters
  const createResponse = specifyCreateResponse();
  const next: any = sinon.fake();

  // Setup stubs
  const coreBackServiceStub = {
    getProvenIdentityUserDetails: sinon.stub(),
  };
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

  const updateDetailsPageTestCases = [
    {
      detailsToUpdate: "address",
      detailsCorrect: "no",
      expectedJourney: "address-only",
    },
    {
      detailsToUpdate: ["givenNames"],
      detailsCorrect: "no",
      expectedJourney: "given-names-only",
    },
    {
      detailsToUpdate: ["familyName"],
      detailsCorrect: "no",
      expectedJourney: "family-name-only",
    },
    {
      detailsToUpdate: ["givenNames", "address"],
      detailsCorrect: "no",
      expectedJourney: "given-names-and-address",
    },
    {
      detailsToUpdate: ["familyName", "address"],
      detailsCorrect: "no",
      expectedJourney: "family-name-and-address",
    },
    {
      detailsToUpdate: ["dateOfBirth"],
      detailsCorrect: "no",
      expectedJourney: "dob",
    },
    {
      detailsToUpdate: ["dateOfBirth", "givenNames"],
      detailsCorrect: "no",
      expectedJourney: "dob-given",
    },
    {
      detailsToUpdate: ["dateOfBirth", "familyName"],
      detailsCorrect: "no",
      expectedJourney: "dob-family",
    },
    {
      detailsToUpdate: ["dateOfBirth", "address"],
      detailsCorrect: "no",
      expectedJourney: "address-dob",
    },
    {
      detailsToUpdate: ["dateOfBirth", "givenNames", "familyName"],
      detailsCorrect: "no",
      expectedJourney: "dob-family-given",
    },
    {
      detailsToUpdate: ["dateOfBirth", "address", "givenNames"],
      detailsCorrect: "no",
      expectedJourney: "address-dob-given",
    },
    {
      detailsToUpdate: ["dateOfBirth", "address", "familyName"],
      detailsCorrect: "no",
      expectedJourney: "address-dob-family",
    },
    {
      detailsToUpdate: ["dateOfBirth", "address", "givenNames", "familyName"],
      detailsCorrect: "no",
      expectedJourney: "address-dob-family-given",
    },
    {
      detailsToUpdate: ["familyName", "givenNames"],
      detailsCorrect: "no",
      expectedJourney: "family-given",
    },
    {
      detailsToUpdate: ["address", "familyName", "givenNames"],
      detailsCorrect: "no",
      expectedJourney: "address-family-given",
    },
  ];

  describe("On the update-details page", () => {
    const createRequest = specifyCreateRequest({
      params: { pageId: "update-details" },
      session: {
        save: sinon.fake.yields(null),
        currentPage: "update-details",
      },
    });

    updateDetailsPageTestCases.forEach(
      ({ detailsToUpdate, detailsCorrect, expectedJourney }) => {
        it(`should set the journey to ${expectedJourney} if detailsCorrect is ${detailsCorrect} and detailsToUpdate is ${detailsToUpdate}`, async () => {
          // Arrange
          const req = createRequest({
            body: {
              detailsToUpdate,
              detailsCorrect,
            },
          });
          const res = createResponse();

          // Act
          await middleware.formHandleUpdateDetailsCheckBox(req, res, next);

          // Assert
          expect(next).to.have.been.calledOnce;
          expect(req.body.journey).to.equal(expectedJourney);
        });
      },
    );
  });

  describe("On the confirm-your-details page", () => {
    const createRequest = specifyCreateRequest({
      params: { pageId: "confirm-your-details" },
      session: {
        save: sinon.fake.yields(null),
        currentPage: "confirm-your-details",
      },
    });

    [
      ...updateDetailsPageTestCases,
      {
        detailsToUpdate: [],
        detailsCorrect: "yes",
        expectedJourney: "next",
      },
      {
        detailsToUpdate: ["familyName", "givenNames"],
        detailsCorrect: "yes",
        expectedJourney: "next",
      },
    ].forEach(
      ({
        detailsToUpdate,
        detailsCorrect,
        expectedJourney,
      }: {
        detailsToUpdate: string | string[];
        detailsCorrect: string;
        expectedJourney: string;
      }) => {
        it(`should set the journey to ${expectedJourney} if detailsCorrect is ${detailsCorrect} and detailsToUpdate is ${detailsToUpdate}`, async () => {
          // Arrange
          const req = createRequest({
            body: { detailsToUpdate, detailsCorrect },
            session: { context: "coi", currentPage: "confirm-your-details" },
          });
          const res = createResponse();

          // Act
          await middleware.formHandleCoiDetailsCheck(req, res, next);

          // Assert
          expect(next).to.have.been.calledOnce;
          expect(req.body.journey).to.equal(expectedJourney);
        });
      },
    );

    it("should set the correct error state if detailsCorrect is empty and detailsToUpdate is empty", async function () {
      // Arrange
      const req = createRequest({
        body: { detailsToUpdate: "", detailsCorrect: "" },
        session: { context: "coi", currentPage: "confirm-your-details" },
      });
      const res = createResponse();
      coreBackServiceStub.getProvenIdentityUserDetails.returns({});

      // Act
      await middleware.formHandleCoiDetailsCheck(req, res, next);

      // Assert
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

    it("should set the correct error state if detailsCorrect is no and detailsToUpdate is empty", async function () {
      // Arrange
      const req = createRequest({
        body: { detailsToUpdate: "", detailsCorrect: "no" },
        session: { context: "coi", currentPage: "confirm-your-details" },
      });
      const res = createResponse();
      coreBackServiceStub.getProvenIdentityUserDetails.resolves({});

      // Act
      await middleware.formHandleCoiDetailsCheck(req, res, next);

      // Assert
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
  });

  it("should not get user details if the page does not require it", async function () {
    // Arrange
    const req = specifyCreateRequest()({
      params: { pageId: "update-details" },
      session: {
        context: undefined,
        currentPage: "check-name-date-birth",
        save: sinon.fake.yields(null),
      },
    });
    const res = createResponse();

    // Act
    await middleware.formHandleCoiDetailsCheck(req, res, next);

    // Assert
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
