import proxyquire from "proxyquire";
import { Request, Response } from "express";
import sinon from "sinon";
import { expect } from "chai";

describe(".well-known middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: any;

  const configStub = {
    IOS_APP_ID: "IOS_APP_ID",
    ANDROID_APP_ID: "ANDROID_APP_ID",
    ANDROID_FINGERPRINT: "ANDROID_FINGERPRINT",
  };

  afterEach(() => {
    sinon.restore();
  });

  let middleware: typeof import("./middleware");

  beforeEach(() => {
    middleware = proxyquire("./middleware", {
      "../../config/config": { default: configStub },
    });

    req = {
      query: {
        preview: "",
      },
    };

    res = {
      status: sinon.stub(),
      json: sinon.stub(),
    };

    next = sinon.stub();
  });

  it("getAppleAppSiteAssociation should return site association file", () => {
    // Act
    middleware.getAppleAppSiteAssociation(
      req as Request,
      res as Response,
      next,
    );

    // Assert
    expect(res.status).to.have.been.calledOnceWith(200);
    expect(res.json).to.have.been.calledOnceWith({
      appLinks: {
        apps: [],
        details: [
          {
            appId: "IOS_APP_ID",
            paths: ["/ipv/app-redirect"],
          },
        ],
      },
    });
  });

  it("getAppleAppSiteAssociation should return site association file", () => {
    // Act
    middleware.getAndroidAssetLinks(req as Request, res as Response, next);

    // Assert
    expect(res.status).to.have.been.calledOnceWith(200);
    expect(res.json).to.have.been.calledOnceWith([
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: "ANDROID_APP_ID",
          sha256_cert_fingerprints: "ANDROID_FINGERPRINT",
        },
      },
    ]);
  });
});
