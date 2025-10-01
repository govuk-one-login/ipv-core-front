import { PHONE_TYPES } from "../../constants/device-constants";
import TechnicalError from "../../errors/technical-error";

export function validatePhoneType(context?: string): asserts context is string {
  if (!context) {
    throw new TechnicalError(`Context cannot be parsed as a phone type: ${context}`);
  }

  if (context.includes(PHONE_TYPES.IPHONE)) return;
  if (context.includes(PHONE_TYPES.ANDROID)) return;

  throw new TechnicalError(`Context cannot be parsed as a phone type: ${context}`);
}
