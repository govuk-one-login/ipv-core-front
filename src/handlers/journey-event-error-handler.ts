import axios from "axios";
import sanitize from "sanitize-filename";
import { HTTP_STATUS_CODES } from "../app.constants";
import { getIpvPageTemplatePath } from "../lib/paths";
import { ErrorRequestHandler } from "express";

const journeyEventErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  res.err = err; // this is required so that the pino logger does not log new error with a different stack trace

  if (axios.isAxiosError(res.err) && res.err.response?.data?.page) {
    const pageId = sanitize(res.err.response.data.page);

    if (res.err?.response?.data?.clientOAuthSessionId) {
      req.session.clientOauthSessionId =
        res.err.response.data.clientOAuthSessionId;
    }
    req.session.currentPage = pageId;

    if (res.err.status) {
      res.status(res.err.status);
    } else {
      res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
    }

    return res.render(getIpvPageTemplatePath(pageId), {
      pageId: pageId,
      csrfToken: req.csrfToken(),
    });
  }

  next(err);
};

export default journeyEventErrorHandler;
