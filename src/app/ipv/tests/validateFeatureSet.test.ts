import { Response, NextFunction } from "express";
import { expect } from "chai";
import sinon from "sinon";
import { validateFeatureSet } from "../middleware";

describe("validateFeatureSet", () => {
  const res = {} as Response;
  let next: NextFunction;

  beforeEach(() => {
    next = sinon.stub() as any;
  });

  it("should call next if featureSet is valid", async () => {
    const req = {
      query: { featureSet: "F01" },
      session: {},
    } as any;
    req.query.featureSet = "F01";
    await validateFeatureSet(req, res, next);

    expect(req.session.featureSet).to.equal("F01");
    expect(next).to.have.been.calledOnce;
  });

  it("should call next if comma separated multiple featureSet is valid", async () => {
    const req = {
      query: { featureSet: "F01,D01" },
      session: {},
    } as any;
    await validateFeatureSet(req, res, next);

    expect(req.session.featureSet).to.equal("F01,D01");
    expect(next).to.have.been.calledOnce;
  });

  const errorTestCases = [
    {
      scenario: "comma separated featureSet is invalid",
      featureSet: "F01, D01",
    },
    {
      scenario: "comma is not followed by text for featureSet",
      featureSet: "F01,",
    },
    { scenario: "empty featureSet is provided", featureSet: "" },
    { scenario: "blank featureSet is provided", featureSet: " " },
    { scenario: "featureSet is invalid", featureSet: "invalid-featureset" },
  ];
  errorTestCases.forEach(
    ({ scenario, featureSet }: { scenario: string; featureSet: string }) => {
      it(`should throw an error if ${scenario}`, async () => {
        const req = {
          query: { featureSet },
          session: {},
        } as any;
        await validateFeatureSet(req, res, next);

        expect(next).to.have.been.calledWith(
          sinon.match
            .instanceOf(Error)
            .and(sinon.match.has("message", "Invalid feature set ID")),
        );
        expect(req.session.featureSet).to.be.undefined;
      });
    },
  );
});
