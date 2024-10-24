import config from "../../lib/config";
import { PHONE_TYPES } from "../../constants/device-constants";

export const getAppStoreRedirectUrl = (phoneType: string): string => {
  if (phoneType !== PHONE_TYPES.IPHONE && phoneType !== PHONE_TYPES.ANDROID) {
    throw new Error(`Unrecognised phone type: ${phoneType}`);
  }

  return config.SERVICE_URL + "/ipv/app-redirect/" + phoneType;
};
