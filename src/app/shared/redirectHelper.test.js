const { expect } = require("chai");
const { saveSessionAndRedirect } = require("./redirectHelper");

describe("saveSessionAndRedirect", () => {
  it("should redirect to given URL", () => {
    const req = {
      session: {
        save: sinon.fake.yields(null),
      },
    };

    const res = {
      redirect: sinon.fake(),
    };
    saveSessionAndRedirect(req, res, "/somewhere");

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
    };

    const res = {
      redirect: sinon.fake(),
    };

    expect(() => saveSessionAndRedirect(req, res, "/somewhere")).to.throw(
      error,
    );
    expect(res.redirect).not.to.have.been.called;
  });
});
