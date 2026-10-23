import { getParameter } from "../services/parameterStoreService";
import { logger } from "../lib/logger";
import { RequestHandler, Request } from "express";
import Config from "../config/config";
import i18next from "i18next";

interface PageBannerConfig {
  pageId: string;
  contexts?: Record<string, unknown>[];
}

export interface BannerConfig {
  pages: PageBannerConfig[];
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

const MAX_NOTIFICATION_BANNERS = 5;

const envVarNameForIndex = (index: number): string =>
  index === 1 ? "NOTIFICATION_BANNER" : `NOTIFICATION_BANNER_${index}`;

const ssmParamNameForIndex = (index: number): string =>
  index === 1
    ? "/core-front/notification-banner"
    : `/core-front/notification-banner${index}`;

const resolveBannerConfig = async (
  index: number,
): Promise<string | undefined> => {
  if (process.env.NODE_ENV === "local") {
    return process.env[envVarNameForIndex(index)];
  }

  try {
    return await getParameter(ssmParamNameForIndex(index));
  } catch (err) {
    logger.info(`No notification banner parameter for index ${index}: ${err}`);
    return undefined;
  }
};

const notificationBannerHandler: RequestHandler = async (req, res, next) => {
  try {
    res.locals.displayBanner = false;

    const bannerConfigsParsed: BannerConfig[] = [];

    const bannerPromises: Promise<string | undefined>[] = [];
    for (let index = 1; index <= MAX_NOTIFICATION_BANNERS; index++) {
      bannerPromises.push(resolveBannerConfig(index));
    }
    const rawConfigs = await Promise.all(bannerPromises);

    rawConfigs.forEach((rawConfig, i) => {
      const index = i + 1;
      logger.info(`${envVarNameForIndex(index)} ${rawConfig}`);

      if (!rawConfig || rawConfig.length === 0) {
        return;
      }

      bannerConfigsParsed.push(...(JSON.parse(rawConfig) as BannerConfig[]));
    });

    if (bannerConfigsParsed.length === 0) {
      return next();
    }

    bannerConfigsParsed.forEach((data: BannerConfig) => {
      validateDate(data.startTime);
      validateDate(data.endTime);

      const bannerStartTime = new Date(data.startTime);
      const bannerEndTime = new Date(data.endTime);
      const currentTime = new Date();

      if (
        (Config.ALWAYS_SHOW_BANNERS ||
          (currentTime >= bannerStartTime && currentTime <= bannerEndTime)) &&
        data.pages.some((p) => shouldDisplayNotificationBanner(p, req))
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
          `Banner enabled for "${req.path}" (context: "${JSON.stringify(req.session.pageContext)}")`,
        );
      }
    });
    next();
  } catch (err) {
    logger.error(err, "Error getting notification banner: " + err);
    next();
  }
};

const shouldDisplayNotificationBanner = (
  pageBannerConfig: PageBannerConfig,
  req: Request,
): boolean => {
  if (pageBannerConfig.pageId !== req.path) {
    return false;
  }

  if (
    !req.session.pageContext ||
    Object.keys(req.session.pageContext).length == 0
  ) {
    const hasNoContextVariant = (): boolean | undefined =>
      pageBannerConfig.contexts?.some((ctx) => Object.keys(ctx).length === 0);
    return !pageBannerConfig.contexts || !!hasNoContextVariant();
  }

  return (
    req.session.pageContext &&
    !!pageBannerConfig.contexts?.some((ctx) =>
      Object.entries(ctx).every(([k, v]) => req.session.pageContext?.[k] === v),
    )
  );
};

export default notificationBannerHandler;
