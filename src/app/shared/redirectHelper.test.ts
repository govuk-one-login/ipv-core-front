import { expect } from "chai";
import sinon from "sinon";
import { saveSessionAndRedirect } from "./redirectHelper";

describe("saveSessionAndRedirect", () => {
  it("should redirect to given URL", async () => {
    const req = {
      session: {
        save: sinon.fake.yields(null),
      },
    } as any;

    const res = {
      redirect: sinon.fake(),
    } as any;

    await saveSessionAndRedirect(req, res, "/somewhere");

    expect(req.session.save).to.have.been.calledOnce;
    expect(res.redirect).to.have.been.calledOnceWith("/somewhere");
  });

  it("should throw if saving session encounters error", async () => {
    const error = new Error("Something went wrong saving session");

    const req = {
      log: {
        error: sinon.fake(),
      },
      session: {
        save: sinon.fake.yields(error),
      },
    } as any;

    const res = {
      redirect: sinon.fake(),
    } as any;

    await expect(
      saveSessionAndRedirect(req, res, "/somewhere"),
    ).to.be.rejectedWith(error);
    expect(res.redirect).not.to.have.been.called;
  });
});
