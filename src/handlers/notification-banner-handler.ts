import { getParameter } from "../services/parameterStoreService";
import { logger } from "../lib/logger";
import { RequestHandler } from "express";
export interface BannerConfig {
  pageId: string;
  context?: string;
  bannerType?: string;
  bannerMessage: string;
  bannerMessageCy: string;
  startTime: string;
  endTime: string;
}

// This should match dates in this format: 2025-05-11T21:00:00.000+0100
const dateFormatRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{4}$/;

const validateDate = (dateString: string): void => {
  if (!dateFormatRegex.test(dateString)) {
    throw new Error(
      `Invalid date format for notification banner: ${dateString}`,
    );
  }
};

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
      validateDate(data.startTime);
      validateDate(data.endTime);

      const bannerStartTime = new Date(data.startTime);
      const bannerEndTime = new Date(data.endTime);
      const currentTime = new Date();
      if (
        req.path === data.pageId &&
        currentTime >= bannerStartTime &&
        currentTime <= bannerEndTime &&
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
    logger.error(err, "Error getting notification banner: " + err);
    next();
  }
};

export default notificationBannerHandler;
