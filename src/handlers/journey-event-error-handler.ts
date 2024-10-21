import { isAxiosError } from "axios";
import sanitize from "sanitize-filename";
import { HTTP_STATUS_CODES } from "../app.constants";
import { getIpvPageTemplatePath } from "../lib/paths";
import { ErrorRequestHandler } from "express";

const journeyEventErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (isAxiosError(res.err) && res.err.response?.data?.page) {
    const pageId = sanitize(res.err.response.data.page);

    if (res.err?.response?.data?.clientOAuthSessionId) {
      req.session.clientOauthSessionId =
        res.err.response.data.clientOAuthSessionId;
    }
    req.session.currentPage = pageId;

    if (res.err.response.status) {
      res.status(res.err.response.status);
    } else {
      res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
    }

    return res.render(getIpvPageTemplatePath(pageId), {
      pageId: pageId,
      csrfToken: req.csrfToken?.(true),
    });
  }

  next(err);
};

export default journeyEventErrorHandler;
