import config from "../../config/config";
import { APP_REDIRECT_PATH } from "../../constants/common-paths";
import { PHONE_TYPES } from "../../constants/device-constants";
import TechnicalError from "../../errors/technical-error";

export const getAppStoreRedirectUrl = (phoneType: string): string => {
  if (phoneType !== PHONE_TYPES.IPHONE && phoneType !== PHONE_TYPES.ANDROID) {
    throw new TechnicalError(`Unrecognised phone type: ${phoneType}`);
  }

  return config.SERVICE_URL + `/ipv/${APP_REDIRECT_PATH}/` + phoneType;
};
