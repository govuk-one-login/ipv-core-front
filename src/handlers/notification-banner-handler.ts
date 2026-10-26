import { getParametersByPath } from "../services/parameterStoreService";
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

const NOTIFICATION_BANNERS_SSM_PATH = "/core-front/notification-banners";

type BannerConfigMap = Record<string, BannerConfig[]>;

const resolveLocalBannerConfigMap = (): BannerConfigMap => {
  const raw = process.env.NOTIFICATION_BANNERS;
  if (!raw || raw.trim().length === 0) {
    return {};
  }
  return JSON.parse(raw) as BannerConfigMap;
};

const resolveSsmBannerConfigMap = async (): Promise<BannerConfigMap> => {
  const parameters = await getParametersByPath(NOTIFICATION_BANNERS_SSM_PATH);
  const map: BannerConfigMap = {};

  for (const [name, value] of Object.entries(parameters)) {
    if (!value || value.length === 0) {
      continue;
    }
    try {
      map[name] = JSON.parse(value) as BannerConfig[];
    } catch (err) {
      logger.error(err, `Invalid notification banner config for "${name}"`);
    }
  }

  return map;
};

const resolveBannerConfigMap = async (): Promise<BannerConfigMap> => {
  try {
    return process.env.NODE_ENV === "local"
      ? resolveLocalBannerConfigMap()
      : await resolveSsmBannerConfigMap();
  } catch (err) {
    logger.error(err, "Error resolving notification banner config: " + err);
    return {};
  }
};

const notificationBannerHandler: RequestHandler = async (req, res, next) => {
  try {
    res.locals.displayBanner = false;

    const bannerConfigMap = await resolveBannerConfigMap();
    const bannerConfigsParsed = Object.values(bannerConfigMap).flat();

    // No banners to process
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
