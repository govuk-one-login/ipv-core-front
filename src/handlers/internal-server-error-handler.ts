import { HTTP_STATUS_CODES } from "../app.constants";
import { isAxiosError } from "axios";
import PAGES from "../constants/ipv-pages";
import { getIpvPageTemplatePath, getErrorPageTemplatePath } from "../lib/paths";
import ERROR_PAGES from "../constants/error-pages";
import { ErrorRequestHandler } from "express";
import HttpError from "../errors/http-error";

export const HANDLED_ERROR = new Error(
  "Placeholder error for events logged in error handler",
);

const getErrorStatus = (err: unknown): number => {
  if (isAxiosError(err)) {
    if (err.response?.status) {
      return err.response.status;
    }
  } else if (err instanceof HttpError) {
    return err.status;
  }
  return HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
};

const serverErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const status = getErrorStatus(err);

  req.log?.error({
    message: {
      description: err?.constructor?.name ?? "Unknown error",
      errorMessage: err?.message ?? "Unkown error",
      errorStack: err?.stack,
    },
  });

  res.status(status);

  if (res.statusCode === HTTP_STATUS_CODES.UNAUTHORIZED) {
    return res.render(getErrorPageTemplatePath(ERROR_PAGES.SESSION_ENDED));
  }

  if (res.statusCode === HTTP_STATUS_CODES.NOT_FOUND) {
    return res.render(getErrorPageTemplatePath(ERROR_PAGES.PAGE_NOT_FOUND));
  }

  // Set this to avoid pino-http generating a new error in the request log
  res.err = HANDLED_ERROR;

  req.session.currentPage = PAGES.PYI_TECHNICAL;
  res.render(getIpvPageTemplatePath(PAGES.PYI_TECHNICAL), {
    context: "unrecoverable",
  });
};

export default serverErrorHandler;
