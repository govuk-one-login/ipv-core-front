import { isAxiosError } from "axios";
import { ErrorRequestHandler } from "express";
import sanitize from "sanitize-filename";
import { HTTP_STATUS_CODES } from "../app.constants";
import { getIpvPagePath } from "../lib/paths";
import { isPageResponse } from "../app/validators/postJourneyEventResponse";
import { HANDLED_ERROR } from "../lib/logger";

const journeyEventErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (isAxiosError(err) && isPageResponse(err.response?.data)) {
    const pageId = sanitize(err.response.data.page);

    if (err.response.data.clientOAuthSessionId) {
      req.session.clientOauthSessionId = err.response.data.clientOAuthSessionId;
    }
    req.session.currentPage = pageId;

    if (err.response.data.statusCode) {
      res.status(err.response.data.statusCode);
    } else {
      res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
    }

    // Set this to avoid pino-http generating a new error in the request log
    res.err = HANDLED_ERROR;

    return res.redirect(getIpvPagePath(pageId));
  }

  return next(err);
};

export default journeyEventErrorHandler;
