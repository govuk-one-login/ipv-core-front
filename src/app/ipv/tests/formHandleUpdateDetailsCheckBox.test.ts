import { NextFunction } from "express";
import { expect } from "chai";
import sinon from "sinon";

import { formHandleUpdateDetailsCheckBox } from "../middleware";

describe("formHandleUpdateDetailsCheckBox middleware", () => {
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

  beforeEach(() => {
    next = sinon.fake() as any;
  });

  const updateDetailsCombosTestData = [
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

  updateDetailsCombosTestData.forEach(
    ({ detailsToUpdate, detailsCorrect, expectedJourney }) => {
      it(`should set the journey to ${expectedJourney} if detailsCorrect is ${detailsCorrect} and detailsToUpdate is ${detailsToUpdate}`, async () => {
        const req = { ...testReq, body: { detailsToUpdate, detailsCorrect } };
        await formHandleUpdateDetailsCheckBox(req, res, next);

        expect(next).to.have.been.calledOnce;
        expect(req.body.journey).to.equal(expectedJourney);
      });
    },
  );
});
