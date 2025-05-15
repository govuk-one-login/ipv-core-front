import proxyquire from "proxyquire";
import { Request, Response } from "express";
import sinon from "sinon";
import { expect } from "chai";

describe(".well-known middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: any;

  const configStub = {
    APPLE_APP_ID: "APPLE_APP_ID",
  };

  afterEach(() => {
    sinon.restore();
  });

  let middleware: typeof import("./middleware");
  describe("getAppleAppSiteAssociation", () => {
    beforeEach(() => {
      middleware = proxyquire("./middleware", {
        "../../config/config": { default: configStub },
        "../ipv/router": { APP_REDIRECT_PATH : "app-redirect"}
      })

      req = {
        query: {
          preview: "",
        },
      };

      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
      };

      next = sinon.stub();

    })
  })

  it("should return site association file", () => {
    // Act
    middleware.getAppleAppSiteAssociation(req as Request, res as Response, next);

    // Assert
    expect(res.status).to.have.been.calledWith(200);
    expect(res.json).to.have.been.calledWith({
      appLinks: {
        apps: [],
        details: [{
          appId: "APPLE_APP_ID",
          paths: [
            `/ipv/app-redirect`
          ]
        }]
      }
    });
  })
})
