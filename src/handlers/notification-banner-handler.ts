import { RequestHandler } from "express";
import { getNotificationBanner } from "../services/parameterStoreService";
import { transformError } from "../app/shared/loggerHelper";

const notificationBannerHandler: RequestHandler = async (req, res, next) => {
  try {
    res.locals.displayBanner = false;
    const data =
      process.env.NODE_ENV === "local"
        ? JSON.parse(process.env["NOTIFICATION_BANNER"] ?? "{}")
        : await getNotificationBanner();
    if (!data) {
      return next();
    }

    const currentTime = new Date().toISOString();
    if (
      req.path === data.pageId &&
      currentTime >= data.startTime &&
      currentTime <= data.endTime
    ) {
      res.locals.displayBanner = true;
      res.locals.bannerType = data.bannerType;
      res.locals.bannerMessage =
        req.i18n.language === "en" ? data.bannerMessage : data.bannerMessageCy;
    }
    next();
  } catch (err) {
    transformError(err, "Error getting notification banner");
    next();
  }
};

export default notificationBannerHandler;
