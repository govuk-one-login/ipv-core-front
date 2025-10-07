import config from "../../config/config";
import { APP_REDIRECT_PATH } from "../../constants/common-paths";
import { PHONE_TYPE } from "../../constants/device-constants";

export const getAppStoreRedirectUrl = (phoneType: PHONE_TYPE): string => {
  return `${config.SERVICE_URL}/ipv/${APP_REDIRECT_PATH}/${phoneType}`;
};
