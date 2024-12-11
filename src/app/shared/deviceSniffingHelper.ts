import UAParser from "ua-parser-js";
import { Request } from "express";
import { PHONE_TYPES, OS_TYPES } from "../../constants/device-constants";
import { APP_TRIAGE_EVENTS } from "../../constants/events";

// The AppTriage event is special in that we want to send a more specialised version if we can detect the current
// device type as being an Android phone or iPhone.
export const detectAppTriageEvent = (req: Request): string => {
  const detectedPhone = sniffPhoneType(req);

  switch (detectedPhone) {
    case PHONE_TYPES.ANDROID:
      return APP_TRIAGE_EVENTS.APP_TRIAGE_ANDROID;
    case PHONE_TYPES.IPHONE:
      return APP_TRIAGE_EVENTS.APP_TRIAGE_IPHONE;
    default:
      return APP_TRIAGE_EVENTS.APP_TRIAGE;
  }
};

export const sniffPhoneType = (
  req: Request,
  fallback?: string,
): string | null => {
  const parser = new UAParser(req.headers["user-agent"]);

  switch (parser.getOS()["name"]) {
    case OS_TYPES.IOS:
      return PHONE_TYPES.IPHONE;
    case OS_TYPES.ANDROID:
      return PHONE_TYPES.ANDROID;
    default:
      return fallback ?? null;
  }
};
