import { NextFunction } from "express";
import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";

describe("formHandleCoiDetailsCheck middleware", () => {
  const testReq = {
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
    postJourneyEvent: sinon.spy(),
    getProvenIdentityUserDetails: sinon.spy(),
  };

  const configStub = {
    API_BASE_URL: "https://example.org/subpath",
    EXTERNAL_WEBSITE_HOST: "https://callbackaddres.org",
    APP_STORE_URL_ANDROID:
      "https://play.google.com/store/apps/details?id=uk.gov.documentchecking",
    APP_STORE_URL_APPLE:
      "https://apps.apple.com/gb/app/gov-uk-id-check/id1629050566",
  };

  const middleware: typeof import("../middleware") = proxyquire(
    "../middleware",
    {
      "../../services/coreBackService": coreBackServiceStub,
      "../../lib/config": { default: configStub },
    },
  );

  beforeEach(() => {
    next = sinon.fake() as any;
  });

  const updateDetailsCombosTestData = [
    {
      detailsToUpdate: [],
      detailsCorrect: "yes",
      expectedJourney: "next",
    },
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
    {
      detailsToUpdate: ["familyName", "givenNames"],
      detailsCorrect: "yes",
      expectedJourney: "next",
    },
  ];
  updateDetailsCombosTestData.forEach(
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
        const req = { ...testReq, body: { detailsToUpdate, detailsCorrect } };
        await middleware.formHandleCoiDetailsCheck(req, res, next);

        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal(expectedJourney);
      });
    },
  );

  it("should set the correct error if detailsCorrect is empty and detailsToUpdate is empty", async function () {
    coreBackServiceStub.getProvenIdentityUserDetails = sinon.fake.returns({});

    const req = {
      ...testReq,
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

  it("should set the correct error if detailsCorrect is no and detailsToUpdate is empty", async function () {
    coreBackServiceStub.getProvenIdentityUserDetails = sinon.fake.resolves({});

    const req = {
      ...testReq,
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
