import { PHONE_TYPES } from "../../constants/device-constants";
import TechnicalError from "../../errors/technical-error";

export function validatePhoneType(context?: string): void {
  const ctx = typeof context === "string" ? context : "";

  if (ctx.includes(PHONE_TYPES.IPHONE)) return;
  if (ctx.includes(PHONE_TYPES.ANDROID)) return;

  throw new TechnicalError(`Context cannot be parsed as a phone type: ${ctx}`);
}
