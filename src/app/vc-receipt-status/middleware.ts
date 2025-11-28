import { Request } from "express";
import { RequestHandler } from "express-serve-static-core";
import { appVcReceived } from "../../services/coreBackService";
import { isJourneyResponse } from "../validators/postJourneyEventResponse";
import { isAxiosError } from "axios";
import config from "../../config/config";
import { logger } from "../../lib/logger";

export enum AppVcReceiptStatus {
  COMPLETED = "COMPLETED",
  PROCESSING = "PROCESSING",
  CLIENT_ERROR = "CLIENT_ERROR",
  SERVER_ERROR = "SERVER_ERROR"
}

export const getAppVcReceiptStatusAndStoreJourneyResponse = async (
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
    } else if( isAxiosError(error) && isClientError(error.response?.status)) {
      return AppVcReceiptStatus.CLIENT_ERROR;
    }
    logger.error(error, "Error getting app vc receipt status");
    return AppVcReceiptStatus.SERVER_ERROR;
  }
};

const isClientError = (error: number | undefined): boolean => {
  if(!error) {
    return false;
  }
  return error >= 400 && error <= 499;
}

export const pollVcReceiptStatus: RequestHandler = async (req, res) => {
  const isPreview = config.ENABLE_PREVIEW && req.query.preview === "true";
  const isSnapshot =
    req.query.snapshotTest === "true" && process.env.NODE_ENV === "local";

  // For snapshot tests, we want to return a completed status
  if (isSnapshot) {
    res.status(200).json({ status: AppVcReceiptStatus.COMPLETED });
    return;
  }

  // For dev/all-templates view, we want to return a processing status
  if (isPreview) {
    res.status(200).json({ status: AppVcReceiptStatus.PROCESSING });
    return;
  }

  const status = await getAppVcReceiptStatusAndStoreJourneyResponse(req);
  if (status === AppVcReceiptStatus.SERVER_ERROR) {
    res.status(500).json({ status });
    return;
  }

  if(status === AppVcReceiptStatus.CLIENT_ERROR) {
    res.status(400).json({ status })
    return;
  }

  res.status(200).json({ status });
};
