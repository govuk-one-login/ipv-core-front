import { Request, Response } from "express";

export const saveSessionAndRedirect = (
  req: Request,
  res: Response,
  redirectUrl: string,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    req.session.save((err: Error) => {
      if (err) {
        reject(err);
      } else {
        resolve(res.redirect(redirectUrl));
      }
    });
  });
};
