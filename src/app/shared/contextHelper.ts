import { PHONE_TYPES } from "../../constants/device-constants";

export const parseContextAsPhoneType = (context?: string): string => {
  if (
    !context ||
    !([PHONE_TYPES.IPHONE, PHONE_TYPES.ANDROID] as string[]).includes(context)
  ) {
    throw new Error(`Context cannot be parsed as a phone type: ${context}`);
  }

  return context;
};
