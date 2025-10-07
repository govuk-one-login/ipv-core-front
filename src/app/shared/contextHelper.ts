import { PHONE_TYPES, PhoneType } from "../../constants/device-constants";
import TechnicalError from "../../errors/technical-error";

export function getPhoneType(context?: string): PhoneType {
  if (!context || typeof context !== "string") {
    throw new TechnicalError(`Invalid phone type context: ${context}`);
  }

  if (context.startsWith(PHONE_TYPES.IPHONE)) {
    return PHONE_TYPES.IPHONE;
  }

  if (context.startsWith(PHONE_TYPES.ANDROID)) {
    return PHONE_TYPES.ANDROID;
  }

  throw new TechnicalError(`Unrecognised phone type: ${context}`);
}
