import { RequestHandler } from "express";
import config from "../../config/config";
import { APP_REDIRECT_PATH } from "../../constants/common-paths";

export const getAppleAppSiteAssociation: RequestHandler = (req, res) => {
  res.type("application/json");

  const appAssociationFile = {
    appLinks: {
      apps: [],
      details: [
        {
          appId: config.APPLE_APP_ID,
          paths: [`/ipv/${APP_REDIRECT_PATH}`],
        },
      ],
    },
  };

  res.status(200);
  res.send(JSON.stringify(appAssociationFile, null, 2));
};

export const getAndroidAssetLinks: RequestHandler = (req, res) => {
  res.type("application/json");

  const androidAssetLinks = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: config.ANDROID_APP_ID,
        sha256_cert_fingerprints: [config.ANDROID_FINGERPRINT],
      },
    },
  ];

  res.status(200);
  res.send(JSON.stringify(androidAssetLinks, null, 2));
};
