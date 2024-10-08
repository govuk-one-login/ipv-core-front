import { InitOptions } from "i18next";
import config from "../lib/config";

export const i18nextConfigurationOptions = (path: string): InitOptions => ({
  debug: false,
  fallbackLng: "en",
  preload: ["en"],
  supportedLngs: ["en", "cy"],
  backend: {
    loadPath: path,
    allowMultiLoading: true,
  },
  detection: {
    lookupCookie: "lng",
    lookupQuerystring: "lng",
    order: ["querystring", "cookie"],
    caches: ["cookie"],
    ignoreCase: true,
    cookieSecure: true,
    cookieDomain: config.SERVICE_DOMAIN,
    cookieSameSite: "",
  },
});
