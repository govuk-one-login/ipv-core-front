import fs from "fs/promises";
import path from "path";

const LOCALE_BASE_PATH = "./locales";

const readTranslations = async (locale: string): Promise<object> =>
  JSON.parse(
    await fs.readFile(
      path.resolve(LOCALE_BASE_PATH, locale, "translation.json"),
      "utf-8",
    ),
  );

const traverseStringProperties = (
  obj: object,
  fn: (key: string, value: string) => void,
  prefix: string = "",
): void => {
  Object.entries(obj).forEach(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      fn(fullKey, value);
    } else if (typeof value === "object") {
      traverseStringProperties(value, fn, fullKey);
    }
  });
};

describe("translations", () => {
  ["en", "cy"].forEach((locale) => {
    it(`should not include straight quotes in ${locale}`, async () => {
      const translations = await readTranslations(locale);

      traverseStringProperties(translations, (key, value) => {
        expect(value).to.not.include(
          "'",
          `${key} includes a straight quote mark`,
        );
      });
    });
  });
});
