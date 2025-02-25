import { Request, Response } from "express";
import { RequestHandler } from "express-serve-static-core";
import { appVcReceived } from "../../services/coreBackService";
import { isJourneyResponse } from "../validators/postJourneyEventResponse";
import { isAxiosError } from "axios";
import config from "../../config/config";
import { logger } from "../../lib/logger";

enum AppVcReceiptStatus {
  COMPLETED = "COMPLETED",
  ERROR = "ERROR",
  PROCESSING = "PROCESSING",
  INTERVENTION = "INTERVENTION",
}

export const getAppVcReceiptStatus: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    // For browser tests
    if (config.ENABLE_PREVIEW && process.env.NODE_ENV === "local") {
      res.status(200).json({ status: AppVcReceiptStatus.COMPLETED });
      return;
    }

    const appVcResponse = await appVcReceived(req);
    if (!isJourneyResponse(appVcResponse.data)) {
      throw new Error(
        "Journey response expected from successful check app vc receipt response.",
      );
    }

    req.session.journey = appVcResponse.data.journey;
    res.status(200).json({ status: AppVcReceiptStatus.COMPLETED });
    return;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      res.status(200).json({ status: AppVcReceiptStatus.PROCESSING });
      return;
    }
    logger.error(error, "Error getting app vc receipt status");
    res.status(500).json({ status: AppVcReceiptStatus.ERROR });
  }
};
