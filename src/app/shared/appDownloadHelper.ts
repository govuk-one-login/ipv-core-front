import config from "../../config/config";
import { APP_REDIRECT_PATH } from "../../constants/common-paths";
import { PhoneType } from "../../constants/device-constants";

export const getAppStoreRedirectUrl = (phoneType: PhoneType): string => {
  return `${config.SERVICE_URL}/ipv/${APP_REDIRECT_PATH}/${phoneType}`;
};
