import { UAParser } from "ua-parser-js";
import { Request } from "express";
import {
  PHONE_TYPES,
  OS_TYPES,
  MINIMUM_IOS_VERSION,
} from "../../constants/device-constants";
import { APP_TRIAGE_EVENTS } from "../../constants/events";

export interface OsType {
  name: string;
  version?: number;
}

// The AppTriage event is special in that we want to send a more specialised version if we can detect the current
// device type as being an Android phone or iPhone.
export const detectAppTriageEvent = (req: Request): string => {
  const detectedPhone = sniffPhoneType(req);

  switch (detectedPhone?.name) {
    case PHONE_TYPES.ANDROID:
      return APP_TRIAGE_EVENTS.MOBILE_DOWNLOAD_ANDROID;
    case PHONE_TYPES.IPHONE:
      if (
        detectedPhone?.version &&
        detectedPhone.version < MINIMUM_IOS_VERSION
      ) {
        return APP_TRIAGE_EVENTS.APP_TRIAGE_SMARTPHONE;
      }
      return APP_TRIAGE_EVENTS.MOBILE_DOWNLOAD_IPHONE;
    default:
      return APP_TRIAGE_EVENTS.APP_TRIAGE;
  }
};

export const sniffPhoneType = (
  req: Request,
  fallback?: OsType,
): OsType | null => {
  const parser = new UAParser(req.headers["user-agent"]);

  const version = parser.getOS()["version"];
  switch (parser.getOS()["name"]) {
    case OS_TYPES.IOS:
      return { name: PHONE_TYPES.IPHONE, version: parseVersion(version) };
    case OS_TYPES.ANDROID:
      return { name: PHONE_TYPES.ANDROID, version: parseVersion(version) };
    default:
      return fallback ?? null;
  }
};

const parseVersion = (version: string | undefined): number | undefined =>
  version ? parseFloat(version) || undefined : undefined;
