import { RequestHandler } from "express";

export const securityHeadersHandler: RequestHandler = (req, res, next) => {
  res.set({
    "Strict-Transport-Security": "max-age=31536000",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "0",
    "X-Content-Type-Options": "nosniff",
  });
  res.removeHeader("X-Powered-By");
  next();
};

export const cspHandler: RequestHandler = (req, res, next) => {
  res.set({
    // Adapted from https://csp.withgoogle.com/docs/strict-csp.html
    "Content-Security-Policy":
      "object-src 'none'; " +
      `script-src 'nonce-${res.locals.cspNonce}' 'unsafe-inline' 'strict-dynamic' https:; ` +
      "base-uri 'none'",
  });
  next();
};
