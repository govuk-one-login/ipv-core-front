import { UAParser } from "ua-parser-js";
import { Request } from "express";
import {
  PHONE_TYPE,
  OS_TYPE,
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
    case PHONE_TYPE.ANDROID:
      if (!detectedPhone?.version) {
        return APP_TRIAGE_EVENTS.APP_TRIAGE_SMARTPHONE;
      }
      return APP_TRIAGE_EVENTS.MOBILE_DOWNLOAD_ANDROID;
    case PHONE_TYPE.IPHONE:
      if (
        !detectedPhone?.version ||
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
  const deviceType = parser.getDevice().type;
  const osName = parser.getOS().name;
  const version = parser.getOS().version;

  // Only treat "mobile" + OS as phone
  if (deviceType === "mobile") {
    if (osName === OS_TYPE.IOS) {
      return { name: PHONE_TYPE.IPHONE, version: parseVersion(version) };
    }
    if (osName === OS_TYPE.ANDROID) {
      return { name: PHONE_TYPE.ANDROID, version: parseVersion(version) };
    }
  }

  // Everything else (tablet, desktop, unknown) → fallback → desktop flow
  return fallback ?? null;
};

const parseVersion = (version: string | undefined): number | undefined =>
  version ? parseFloat(version) || undefined : undefined;
