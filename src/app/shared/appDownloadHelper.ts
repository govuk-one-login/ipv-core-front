import config from "../../config/config";
import { APP_REDIRECT_PATH } from "../../constants/common-paths";
import { PHONE_TYPES } from "../../constants/device-constants";

export const getAppStoreRedirectUrl = (phoneType: PHONE_TYPES): string => {
  return `${config.SERVICE_URL}/ipv/${APP_REDIRECT_PATH}/${phoneType}`;
};
