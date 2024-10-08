import { promisify } from "util";
import { randomBytes } from "crypto";

const asyncRandomBytes = promisify(randomBytes);

export const generateNonce = async (): Promise<string> =>
  (await asyncRandomBytes(16)).toString("hex");
