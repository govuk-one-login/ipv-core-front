import { NextFunction } from "express";
import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";

describe("handle update details/COI form checkbox", () => {
  let next: NextFunction;

  const testReq = {
    body: {},
    params: { pageId: "update-details" },
    csrfToken: sinon.fake(),
    session: {
      currentPage: "update-details",
      save: sinon.fake.yields(null),
    },
    log: { error: sinon.fake() },
  } as any;

  const res = {
    status: sinon.fake(),
    redirect: sinon.fake(),
    send: sinon.fake(),
    render: sinon.fake(),
    log: { info: sinon.fake(), error: sinon.fake() },
    locals: { contactUsUrl: "contactUrl", deleteAccountUrl: "deleteAccount" },
  } as any;

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
    next = sinon.fake() as any;
    res.render = sinon.fake();
  });

  const testCases = [
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

  context("On the update-details page", () => {
    testCases.forEach(
      ({ detailsToUpdate, detailsCorrect, expectedJourney }) => {
        it(`should set the journey to ${expectedJourney} if detailsCorrect is ${detailsCorrect} and detailsToUpdate is ${detailsToUpdate}`, async () => {
          const req = { ...testReq, body: { detailsToUpdate, detailsCorrect } };
          await middleware.formHandleUpdateDetailsCheckBox(req, res, next);

          expect(next).to.have.been.calledOnce;
          expect(req.body.journey).to.equal(expectedJourney);
        });
      },
    );
  });

  context("On the confirm-your-details page", () => {
    const coiTestReq = {
      ...testReq,
      params: { pageId: "confirm-your-details" },
      session: {
        ...testReq.session,
        context: "coi",
        currentPage: "confirm-your-details",
      },
    };

    const coiDetailsCombosTestData = [
      ...testCases,
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
    ];

    coiDetailsCombosTestData.forEach(
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
          const req = {
            ...coiTestReq,
            body: { detailsToUpdate, detailsCorrect },
          };
          await middleware.formHandleCoiDetailsCheck(req, res, next);

          expect(next).to.have.been.calledOnce;
          expect(req.body.journey).to.equal(expectedJourney);
        });
      },
    );

    it("should set the correct error state if detailsCorrect is empty and detailsToUpdate is empty", async function () {
      coreBackServiceStub.getProvenIdentityUserDetails = sinon.fake.returns({});

      const req = {
        ...coiTestReq,
        body: { detailsToUpdate: "", detailsCorrect: "" },
      };
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

    it("should set the correct error state if detailsCorrect is no and detailsToUpdate is empty", async function () {
      coreBackServiceStub.getProvenIdentityUserDetails = sinon.fake.resolves(
        {},
      );

      const req = {
        ...coiTestReq,
        body: { detailsToUpdate: "", detailsCorrect: "no" },
      };
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
  });

  it("should not get user details if the page does not require it", async function () {
    coreBackServiceStub.getProvenIdentityUserDetails = sinon.fake.returns({});

    const req = {
      ...testReq,
      session: {
        ...testReq.session,
        currentPage: "check-name-date-birth",
        context: undefined,
      },
    };
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
