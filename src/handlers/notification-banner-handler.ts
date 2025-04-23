import { RequestHandler } from "express";
import { getParameter } from "../services/parameterStoreService";
import { logger } from "../lib/logger";
export interface BannerConfig {
  pageId: string;
  context?: string;
  bannerType?: string;
  bannerMessage: string;
  bannerMessageCy: string;
  startTime: string;
  endTime: string;
}

const notificationBannerHandler: RequestHandler = async (req, res, next) => {
  try {
    res.locals.displayBanner = false;
    const bannerConfigs1 =
      process.env.NODE_ENV === "local"
        ? process.env["NOTIFICATION_BANNER"]
        : await getParameter("/core-front/notification-banner");
    const bannerConfigs2 =
      process.env.NODE_ENV === "local"
        ? process.env["NOTIFICATION_BANNER_2"]
        : await getParameter("/core-front/notification-banner2");

    if (
      (!bannerConfigs1 || bannerConfigs1.length === 0) &&
      (!bannerConfigs2 || bannerConfigs2.length === 0)
    ) {
      return next();
    }

    const bannerConfigs1Parsed: BannerConfig[] = bannerConfigs1
      ? JSON.parse(bannerConfigs1)
      : [];
    const bannerConfigs2Parsed: BannerConfig[] = bannerConfigs2
      ? JSON.parse(bannerConfigs2)
      : [];

    const bannerConfigsParsed: BannerConfig[] =
      bannerConfigs1Parsed.concat(bannerConfigs2Parsed);

    bannerConfigsParsed.forEach((data: BannerConfig) => {
      const currentTime = new Date().toISOString();
      if (
        req.path === data.pageId &&
        currentTime >= data.startTime &&
        currentTime <= data.endTime &&
        ((!req.session.context && !data.context) ||
          req.session.context === data.context)
      ) {
        res.locals.displayBanner = true;
        res.locals.bannerType = data.bannerType;
        res.locals.bannerMessage =
          req.i18n.language === "cy"
            ? data.bannerMessageCy
            : data.bannerMessage;
      }
    });
    next();
  } catch (err) {
    logger.error(err, "Error getting notification banner");
    next();
  }
};

export default notificationBannerHandler;
