import { PHONE_TYPE } from "../../constants/device-constants";
import TechnicalError from "../../errors/technical-error";

export function getPhoneType(smartphone?: string): PHONE_TYPE {
  if (!smartphone || typeof smartphone !== "string") {
    throw new TechnicalError(`Invalid phone type context: ${smartphone}`);
  }

  if (smartphone.startsWith(PHONE_TYPE.IPHONE)) {
    return PHONE_TYPE.IPHONE;
  }

  if (smartphone.startsWith(PHONE_TYPE.ANDROID)) {
    return PHONE_TYPE.ANDROID;
  }

  throw new TechnicalError(`Unrecognised phone type: ${smartphone}`);
}
