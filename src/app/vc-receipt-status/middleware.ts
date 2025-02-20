import { Request, Response } from "express";
import { NextFunction, RequestHandler } from "express-serve-static-core";
import { appVcReceived } from "../../services/coreBackService";

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
    const dcmaw = await appVcReceived(req);
    if (!dcmaw) {
      res.status(200).json({ status: AppVcReceiptStatus.PROCESSING });
    }
    res.status(200).json({ status: AppVcReceiptStatus.COMPLETED });
  } catch (error) {
    res.status(500).json({ status: AppVcReceiptStatus.ERROR });
    next(error);
  }
};
