import { PHONE_TYPES } from "../../constants/device-constants";

export function validatePhoneType(context?: string): asserts context is string {
  if (
    !context ||
    !([PHONE_TYPES.IPHONE, PHONE_TYPES.ANDROID] as string[]).includes(context)
  ) {
    throw new Error(`Context cannot be parsed as a phone type: ${context}`);
  }
}
