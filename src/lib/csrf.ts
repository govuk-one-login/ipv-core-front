import { csrfSync } from "csrf-sync";
import { Request } from "express";
import BadRequestError from "../errors/bad-request-error";

const { csrfSynchronisedProtection, getTokenFromRequest, generateToken } = csrfSync({
  getTokenFromRequest: (req: Request) => {
    if (!req.body) {
      throw new BadRequestError("Missing request body");
    }

    return req.body["_csrf"];
  },
});

export { csrfSynchronisedProtection, getTokenFromRequest, generateToken };
