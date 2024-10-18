import { RequestHandler } from "express";
import { getParameter } from "../services/parameterStoreService";

const notificationBannerHandler: RequestHandler = async (req, res, next) => {
  try {
    const data = await getParameter("notification-banner");
    res.locals.displayBanner = false;
    if (!data) {
      return next();
    }

    const currentTime = Date.now();
    if (
      req.originalUrl === data.pageId &&
      currentTime >= data.startTime &&
      currentTime <= data.endTime
    ) {
      res.locals.displayBanner = true;
      res.locals.bannerType = data.bannerType;
      res.locals.bannerMessage = data.bannerMessage;
    }
    next();
  } catch (err) {
    next(err);
  }
};

export default notificationBannerHandler;
