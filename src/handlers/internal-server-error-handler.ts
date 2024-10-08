import { HTTP_STATUS_CODES } from "../app.constants";
import axios from "axios";
import PAGES from "../constants/ipv-pages";
import { getIpvPageTemplatePath, getErrorPageTemplatePath } from "../lib/paths";
import ERROR_PAGES from "../constants/error-pages";
import { ErrorRequestHandler } from "express";

const hasStatus = (input: unknown): input is { status: number } =>
  !!(input as { status: number }).status;

export const serverErrorHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  next,
) => {
  if (res.headersSent) {
    return next(err);
  }

  if (!axios.isAxiosError(err)) {
    req.log.error({
      message: { err, message: "An internal server error occured" },
      level: "ERROR",
    });
  }

  if (res.statusCode === HTTP_STATUS_CODES.UNAUTHORIZED) {
    return res.render(getErrorPageTemplatePath(ERROR_PAGES.SESSION_ENDED));
  }
  res.err = err; // this is required so that the pino logger does not log new error with a different stack trace

  if (hasStatus(res.err)) {
    res.status(res.err.status);
  } else {
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
  }

  req.session.currentPage = PAGES.PYI_TECHNICAL;
  res.render(getIpvPageTemplatePath(PAGES.PYI_TECHNICAL), {
    context: "unrecoverable",
  });
};
