import { PHONE_TYPE } from "../../constants/device-constants";
import TechnicalError from "../../errors/technical-error";

export function getPhoneType(smartphone?: string): PHONE_TYPE {
  if (!smartphone || typeof smartphone !== "string") {
    throw new TechnicalError(`Invalid phone type context: ${smartphone}`);
  }

  if (smartphone === PHONE_TYPE.IPHONE || smartphone === PHONE_TYPE.ANDROID) {
    return smartphone;
  }

  throw new TechnicalError(`Unrecognised phone type: ${smartphone}`);
}
