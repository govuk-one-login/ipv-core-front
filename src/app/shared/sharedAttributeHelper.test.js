const { expect } = require("chai");
const proxyquire = require("proxyquire");

describe("shared attributes", () => {
  describe("getSharedAttributesJwt", () => {
    const axiosStub = {};
    let axiosResponse;

    const configStub = {
      API_SHARED_ATTRIBUTES_JWT_PATH: "/shared-attributes",
      API_BASE_URL: "https://example.org/subpath",
    };


    const sharedAttribute = proxyquire("../shared/sharedAttributeHelper", {
      axios: axiosStub,
      "../../lib/config": configStub
    });

    let req;
    let res;
    let next;

    beforeEach(() => {
      res = {
        status: sinon.fake(),
        redirect: sinon.fake(),
        send: sinon.fake(),
        render: sinon.fake(),
      };
      req = {
        session: {}
      };
      next = sinon.fake();

      axiosResponse = {
        data: undefined
      };

      axiosStub.get = sinon.fake.returns(axiosResponse);
    });

    context("successfully gets issued jwt from core-back", () => {
      beforeEach(() => {
        axiosResponse.data = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJkYXRlT2ZCaXJ0aHMiOltdLCJhZGRyZXNzZXMiOltdLCJuYW1lcyI6W10sImFkZHJlc3NIaXN0b3J5IjpbXX0.DwQQOldmOYQ1Lv6OJETzks7xv1fM7VzW0O01H3-uQqQ_rSkCZrd2KwQHHzo0Ddw2K_LreePy-tEr-tiPgi8Yl604n3rwQy6xBat8mb4lTtNnOxsUOYviYQxC5aamsvBAS27G43wFejearXHWzEqhJhIFdGE4zJkgZAKpLGzvOXLvX4NZM4aI4c6jMgpktkvvFey-O0rI5ePh5RU4BjbG_hvByKNlLr7pzIlsS-Q8KuIPawqFJxN2e3xfj1Ogr8zO0hOeDCA5dLDie78sPd8ph0l5LOOcGZskd-WD74TM6XeinVpyTfN7esYBnIZL-p-qULr9CUVIPCMxn-8VTj3SOw==";
      });
      it("should set issued jwt on request in session", async function () {
        await sharedAttribute.getSharedAttributesJwt(req, res, next);
        expect(req.session.sharedAttributesJwt).to.eql(axiosResponse.data);
      });

      it("should call next", async function () {
        await sharedAttribute.getSharedAttributesJwt(req, res, next);

        expect(next).to.have.been.called;
      });
    });

    context("with missing jwt", () => {
      beforeEach(() => {
        axiosStub.get = sinon.fake.returns(axiosResponse);
      });

      it("should send a 500 error with correct error message", async function () {
        await sharedAttribute.getSharedAttributesJwt(req, res);

        expect(res.status).to.have.been.calledWith(500);
        expect(res.send).to.have.been.calledWith("Missing JWT");
      });

      it("should not call next", async function () {
        await sharedAttribute.getSharedAttributesJwt(req, res);

        expect(next).to.not.have.been.called;
      });
    });

    context("with jwt being too large", () => {
      beforeEach(() => {
        axiosResponse.data = "YXJuaXQ" + "a".repeat(6000) + "=";
      });

      it("should send a 500 error with correct error message", async function () {
        await sharedAttribute.getSharedAttributesJwt(req, res);

        expect(res.status).to.have.been.calledWith(500);
        expect(res.send).to.have.been.calledWith("JWT exceeds maximum limit");

      });

      it("should not call next", async function () {
        await sharedAttribute.getSharedAttributesJwt(req, res);

        expect(next).to.not.have.been.called;
      });
    });

    context("with invalid base64 encoded jwt", () => {
      beforeEach(() => {
        axiosResponse.data = "example";
      });

      it("should send a 500 error with correct error message", async function () {
        await sharedAttribute.getSharedAttributesJwt(req, res);

        expect(res.status).to.have.been.calledWith(500);
        expect(res.send).to.have.been.calledWith("Invalid base64 encoded JWT");

      });

      it("should not call next", async function () {
        await sharedAttribute.getSharedAttributesJwt(req, res);

        expect(next).to.not.have.been.called;
      });
    });

    context("with axios error", () => {
      let errorMessage;

      beforeEach(() => {
        errorMessage = "server error";
        axiosStub.get = sinon.fake.throws(new Error(errorMessage));
      });

      it("should send call next with error when jwt is missing", async () => {
        await sharedAttribute.getSharedAttributesJwt(req, res, next);

        expect(next).to.have.been.calledWith(
          sinon.match
            .instanceOf(Error)
            .and(sinon.match.has("message", errorMessage))
        );
      });
    });
  });
});
