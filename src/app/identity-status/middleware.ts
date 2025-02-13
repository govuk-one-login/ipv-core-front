import { Request, Response } from "express";
import { NextFunction, RequestHandler } from "express-serve-static-core";

export const proveIdentityStatusCallbackGet: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Immediately send "PROCESSING" status
    res.status(200).json({ status: "PROCESSING" });

    // Wait for 1 minute (60000 milliseconds)
    setTimeout(() => {
      // Send "COMPLETED" status after 1 minute
      res.status(200).json({ status: "COMPLETED" });
    }, 60000);
  } catch {
    res.status(500).json({ status: "ERROR" });
  }

  next();
};
