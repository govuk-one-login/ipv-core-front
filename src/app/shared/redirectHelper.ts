import { Response, Request } from "express";
import { logError } from "./loggerHelper";

export const saveSessionAndRedirect = (
  req: Request,
  res: Response,
  redirectUrl: string,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    req.session.save((err: Error) => {
      if (err) {
        logError(req, err, "Error saving session");
        reject(err);
      } else {
        resolve(res.redirect(redirectUrl));
      }
    });
  });
};
