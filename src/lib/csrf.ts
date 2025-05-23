import { csrfSync } from "csrf-sync";
import { Request } from "express";
import BadRequestError from "../errors/bad-request-error";
import ForbiddenError from "../errors/forbidden-error";

const { csrfSynchronisedProtection, getTokenFromRequest } = csrfSync({
  getTokenFromRequest: (req: Request) => {
    if (!req.body) {
      throw new BadRequestError("Missing request body");
    }

    const csrfToken = req.body["_csrf"];
    if (!csrfToken) {
      throw new ForbiddenError("Missing csrf token");
    }

    return csrfToken;
  },
});

export { csrfSynchronisedProtection, getTokenFromRequest };
