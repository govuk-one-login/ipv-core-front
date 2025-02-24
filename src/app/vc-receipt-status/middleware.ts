import { Request, Response } from "express";
import { NextFunction, RequestHandler } from "express-serve-static-core";
import { appVcReceived } from "../../services/coreBackService";
import { isJourneyResponse } from "../validators/postJourneyEventResponse";
import { isAxiosError } from "axios";
import config from "../../config/config";

enum AppVcReceiptStatus {
  COMPLETED = "COMPLETED",
  ERROR = "ERROR",
  PROCESSING = "PROCESSING",
  INTERVENTION = "INTERVENTION",
}

export const getAppVcReceiptStatus: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // For browser tests
    if (config.ENABLE_PREVIEW) {
      res.status(200).json({ status: AppVcReceiptStatus.COMPLETED });
      return;
    }

    const appVcResponse = await appVcReceived(req);

    if (isJourneyResponse(appVcResponse.data)) {
      req.session.journey = appVcResponse.data.journey;
    }

    res.status(200).json({ status: AppVcReceiptStatus.COMPLETED });
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      res.status(200).json({ status: AppVcReceiptStatus.PROCESSING });
      return;
    }
    res.status(500).json({ status: AppVcReceiptStatus.ERROR });
    next(error);
  }
};
