import { Response, Request } from "express";
import { logError } from "./loggerHelper";

export const saveSessionAndRedirect = (
  req: Request,
  res: Response,
  redirectUrl: string,
): void => {
  req.session.save((err) => {
    if (err) {
      logError(req, err, "Error saving session");
      throw err;
    }
    return res.redirect(redirectUrl);
  });
};
