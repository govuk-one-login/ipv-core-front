import { HTTP_STATUS_CODES } from "../app.constants";
import { getErrorPageTemplatePath } from "../lib/paths";
import ERROR_PAGES from "../constants/error-pages";
import { RequestHandler } from "express";

export const pageNotFoundHandler: RequestHandler = (req, res, next) => {
  if (res.headersSent) {
    return next();
  }

  res.status(HTTP_STATUS_CODES.NOT_FOUND);
  res.render(getErrorPageTemplatePath(ERROR_PAGES.PAGE_NOT_FOUND));
};
