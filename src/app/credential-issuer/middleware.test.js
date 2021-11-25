const proxyquire = require("proxyquire");
const configStub = { CREDENTIAL_ISSUER_BASE_URL: "http://example.com" }
const redirectToAuthorize = proxyquire("./middleware", {
  "../../lib/config": configStub,
});
describe('credential issuer middleware', () => {
  describe("redirectToAuthorize", () => {
    it("should successfully be redirected", async function () {
      let req;
      let res = { redirect: sinon.fake() };
      await redirectToAuthorize(req, res);

      expect(res.redirect).to.have.been.calledWith(`http://example.com/authorize`)
    });
  });
});
