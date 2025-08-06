import { getParameter } from "../services/parameterStoreService";
import { logger } from "../lib/logger";
import { RequestHandler } from "express";
import Config from "../config/config";
import i18next from "i18next";
export interface BannerConfig {
  pages: [
    {
      pageId: string;
      contexts?: string[];
    },
  ];
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
        (Config.ALWAYS_SHOW_BANNERS ||
          (currentTime >= bannerStartTime && currentTime <= bannerEndTime)) &&
        data.pages.some(
          (p) =>
            p.pageId === req.path &&
            ((!req.session.context &&
              (!p.contexts || p.contexts?.includes(""))) ||
              (req.session.context &&
                p.contexts?.includes(req.session.context))),
        )
      ) {
        res.locals.displayBanner = true;
        res.locals.bannerType = data.bannerType;
        res.locals.bannerMessage =
          req.i18n.language === "cy"
            ? data.bannerMessageCy
            : data.bannerMessage;
        const translate = i18next.getFixedT(req.i18n.language);
        res.locals.bannerTitleText = translate(
          "general.govuk.notificationBanner.title",
        );

        logger.info(
          `Banner enabled for "${req.path}" (context: "${req.session.context}")`,
        );
      }
    });
    next();
  } catch (err) {
    logger.error(err, "Error getting notification banner: " + err);
    next();
  }
};

export default notificationBannerHandler;
