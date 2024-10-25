import { PHONE_TYPES } from "../../constants/device-constants";
import TechnicalError from "../../errors/technical-error";

export function validatePhoneType(context?: string): asserts context is string {
  if (
    !context ||
    !([PHONE_TYPES.IPHONE, PHONE_TYPES.ANDROID] as string[]).includes(context)
  ) {
    throw new TechnicalError(
      `Context cannot be parsed as a phone type: ${context}`,
    );
  }
}
