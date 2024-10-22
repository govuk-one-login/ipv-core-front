import { csrfSync } from "csrf-sync";
import { Request } from "express";

const { csrfSynchronisedProtection } = csrfSync({
  getTokenFromRequest: (req: Request) => {
    return req.body["_csrf"];
  },
});

export { csrfSynchronisedProtection };
