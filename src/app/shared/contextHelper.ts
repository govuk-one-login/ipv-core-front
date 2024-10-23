import CONTEXTS from "../../constants/contexts";
import PHONE_TYPES from "../../constants/phone-types";

export const parseContextAsPhoneType = (context?: string): string => {
  switch (context) {
    case CONTEXTS.IPHONE:
      return PHONE_TYPES.IPHONE;
    case CONTEXTS.ANDROID:
      return PHONE_TYPES.ANDROID;
    default:
      throw new Error(`Context cannot be parsed as a phone type: ${context}`);
  }
};
