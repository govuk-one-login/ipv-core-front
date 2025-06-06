import { HTTP_STATUS_CODES } from "../app.constants";
import { AxiosError, isAxiosError } from "axios";
import { ErrorRequestHandler } from "express";
import { isHttpError } from "http-errors";
import PAGES from "../constants/ipv-pages";
import {
  getIpvPageTemplatePath,
  getErrorPageTemplatePath,
  getHtmlPath,
} from "../lib/paths";
import ERROR_PAGES from "../constants/error-pages";
import HttpError from "../errors/http-error";
import { HANDLED_ERROR } from "../lib/logger";
import UnauthorizedError from "../errors/unauthorized-error";

export const getErrorStatus = (err: unknown): number => {
  if (isAxiosError(err)) {
    // Axios Errors pass through the status from core-back
    if (err.response?.status) {
      return err.response.status;
    }
  } else if (err instanceof HttpError) {
    // Our HTTP errors return the defined status
    return err.status;
  } else if (isHttpError(err)) {
    // Other HTTP errors return the defined status (used by csrf-sync)
    return err.status;
  }
  return HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
};

const serverErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  // Overload protection will propagate the 503 through the err object
  if (err.statusCode === HTTP_STATUS_CODES.SERVICE_UNAVAILABLE) {
    res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE);
    // Using res.render instead of res.sendFile as res.sendFile does not cache the
    // file in memory and will pull from disk each time
    return res.render(getHtmlPath(ERROR_PAGES.SERVICE_UNAVAILABLE));
  }

  const status = getErrorStatus(err);

  if (err instanceof UnauthorizedError) {
    req.log?.warn({
      message: {
        description: UnauthorizedError.constructor.name,
        errorMessage: err?.message ?? "Unknown error",
        errorStack: err?.stack,
      },
    });
  } else if (!(err instanceof AxiosError)) {
    req.log?.error({
      message: {
        description: err?.constructor?.name ?? "Unknown error",
        errorMessage: err?.message ?? "Unknown error",
        errorStack: err?.stack,
      },
    });
  }

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
