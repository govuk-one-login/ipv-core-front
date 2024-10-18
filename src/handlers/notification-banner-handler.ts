import { RequestHandler } from "express";
import { getParameter } from "../services/parameterStoreService";

const notificationBannerHandler: RequestHandler = async (req, res, next) => {
  try {
    const data = await getParameter('notification-banner');
    console.log(req.params.pageId, req.query.pageId, req.originalUrl)
    res.locals.displayBanner = false;
    if (!data) {
      return next();
    }
  
    if (req.originalUrl === data.pageId) {
      res.locals.displayBanner = true;
      res.locals.bannerType = data.bannerType;
      res.locals.bannerMessage = data.bannerMessage;
    }
    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
}

export default notificationBannerHandler;
