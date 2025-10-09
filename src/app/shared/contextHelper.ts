import { PHONE_TYPE } from "../../constants/device-constants";
import TechnicalError from "../../errors/technical-error";

export function getPhoneType(context?: string): PHONE_TYPE {
  if (!context || typeof context !== "string") {
    throw new TechnicalError(`Invalid phone type context: ${context}`);
  }

  if (context.startsWith(PHONE_TYPE.IPHONE)) {
    return PHONE_TYPE.IPHONE;
  }

  if (context.startsWith(PHONE_TYPE.ANDROID)) {
    return PHONE_TYPE.ANDROID;
  }

  throw new TechnicalError(`Unrecognised phone type: ${context}`);
}
