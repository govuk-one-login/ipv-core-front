import { HTTP_STATUS_CODES } from "../app.constants";
import { isAxiosError } from "axios";
import PAGES from "../constants/ipv-pages";
import { getIpvPageTemplatePath, getErrorPageTemplatePath } from "../lib/paths";
import ERROR_PAGES from "../constants/error-pages";
import { ErrorRequestHandler } from "express";
import TechnicalError from "../errors/technical-error";
import BadRequestError from "../errors/bad-request-error";

const serverErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let status = HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;

  // TODO: should this live in the logger middleware instead?
  if (isAxiosError(err)) {
    if (err.response?.status) {
      status = err.response.status;
    }
    // Already logged in the axios handler
  } else if (err instanceof TechnicalError || err instanceof BadRequestError) {
    req.log?.error({
      message: {
        description: err.constructor.name,
        errorMessage: err.message,
      },
    });
    status = err.status;
  } else {
    req.log?.error({
      message: {
        description: "An unknown error occurred",
        errorMessage: err?.message,
      },
    });
  }

  res.status(status);

  if (status === HTTP_STATUS_CODES.UNAUTHORIZED) {
    return res.render(getErrorPageTemplatePath(ERROR_PAGES.SESSION_ENDED));
  }

  res.err = err; // Attach error object for the pino response logger

  req.session.currentPage = PAGES.PYI_TECHNICAL;
  res.render(getIpvPageTemplatePath(PAGES.PYI_TECHNICAL), {
    context: "unrecoverable",
  });
};

export default serverErrorHandler;
