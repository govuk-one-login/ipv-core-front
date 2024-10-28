import { RequestHandler } from "express";
import { getParameter } from "../services/parameterStoreService";
import { logger } from "../lib/logger";
export interface BannerConfig {
  pageId: string;
  bannerType?: string;
  bannerMessage: string;
  bannerMessageCy: string;
  startTime: string;
  endTime: string;
}

const notificationBannerHandler: RequestHandler = async (req, res, next) => {
  try {
    res.locals.displayBanner = false;
    const bannerConfigs =
      process.env.NODE_ENV === "local"
        ? process.env["NOTIFICATION_BANNER"]
        : await getParameter("/core-front/notification-banner");

    const bannerConfigsParsed: BannerConfig[] = bannerConfigs
      ? JSON.parse(bannerConfigs)
      : [];
    if (!bannerConfigs || bannerConfigs.length === 0) {
      return next();
    }

    bannerConfigsParsed.forEach((data: BannerConfig) => {
      const currentTime = new Date().toISOString();
      if (
        req.path === data.pageId &&
        currentTime >= data.startTime &&
        currentTime <= data.endTime
      ) {
        res.locals.displayBanner = true;
        res.locals.bannerType = data.bannerType;
        res.locals.bannerMessage =
          req.i18n.language === "en"
            ? data.bannerMessage
            : data.bannerMessageCy;
      }
    });
    next();
  } catch (err) {
    logger.error(err, "Error getting notification banner");
    next();
  }
};

export default notificationBannerHandler;
