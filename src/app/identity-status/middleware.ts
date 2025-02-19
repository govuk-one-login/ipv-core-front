import { Request, Response } from "express";
import { NextFunction, RequestHandler } from "express-serve-static-core";
import { getDcMawPoll } from "../../services/coreBackService";

enum IdentityProcessingStatus {
  COMPLETED = "COMPLETED",
  ERROR = "ERROR",
  PROCESSING = "PROCESSING",
  INTERVENTION = "INTERVENTION",
}

export const proveIdentityStatusCallbackGet: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const dcmaw = await getDcMawPoll(req);
    if (!dcmaw) {
      res.status(200).json({ status: IdentityProcessingStatus.PROCESSING });
    }
    res.status(200).json({ status: IdentityProcessingStatus.COMPLETED });
  } catch (error) {
    res.status(500).json({ status: IdentityProcessingStatus.ERROR });
    next(error);
  }
};
