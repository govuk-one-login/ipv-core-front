import { Request, Response } from "express";
import { RequestHandler } from "express-serve-static-core";
import { appVcReceived } from "../../services/coreBackService";
import { isJourneyResponse } from "../validators/postJourneyEventResponse";
import { isAxiosError } from "axios";
import config from "../../config/config";
import { logger } from "../../lib/logger";

export enum AppVcReceiptStatus {
  COMPLETED = "COMPLETED",
  ERROR = "ERROR",
  PROCESSING = "PROCESSING",
  INTERVENTION = "INTERVENTION",
}

export const getAppVcReceipt = async (
  req: Request,
): Promise<AppVcReceiptStatus> => {
  try {
    const appVcResponse = await appVcReceived(req);
    if (!isJourneyResponse(appVcResponse.data)) {
      throw new Error(
        "Journey response expected from successful check app vc receipt response.",
      );
    }
    req.session.journey = appVcResponse.data.journey;

    return AppVcReceiptStatus.COMPLETED;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return AppVcReceiptStatus.PROCESSING;
    }
    logger.error(error, "Error getting app vc receipt status");
    return AppVcReceiptStatus.ERROR;
  }
};

export const getAppVcReceiptStatus: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  if (config.ENABLE_PREVIEW && process.env.NODE_ENV === "local") {
    res.status(200).json({ status: AppVcReceiptStatus.COMPLETED });
    return;
  }

  const status = await getAppVcReceipt(req);
  if (status === AppVcReceiptStatus.ERROR) {
    res.status(500).json({ status });
    return;
  }

  res.status(200).json({ status });
  return;
};
