import { RequestHandler } from "express";
import config from "../../config/config";
import { APP_REDIRECT_PATH } from "../../constants/device-constants";

export const getAppleAppSiteAssociation: RequestHandler = (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const appAssociationFile  = {
    appLinks: {
      apps: [],
      details: [{
        appId: config.APPLE_APP_ID,
        paths: [
          `/ipv/${APP_REDIRECT_PATH}`
        ]
      }]
    }
  }

  res.status(200).json(appAssociationFile);
}
