import { contactUsUrl, addLanguageParam } from "@govuk-one-login/frontend-ui";
import i18next from "i18next";
import nunjucks, { Environment, ConfigureOptions } from "nunjucks";
import path from "path";
import { kebabCaseToPascalCase } from "../app/shared/stringHelper";
import Config from "./config";

export const VIEWS = [
  path.resolve("views/"),
  path.resolve("node_modules/govuk-frontend/dist/"),
  path.resolve("node_modules/@govuk-one-login/"),
  path.resolve("node_modules/@govuk-one-login/frontend-ui"),
];

interface FilterContext {
  ctx: {
    i18n: {
      language: string;
    };
  };
}

export const configureNunjucks = (
  nunjucksOptions: ConfigureOptions = {},
  appViews: string[] = VIEWS,
): Environment => {
  const nunjucksEnv = nunjucks.configure(appViews, {
    autoescape: true,
    ...nunjucksOptions,
  });

  nunjucksEnv.addFilter(
    "translate",
    function (this: FilterContext, key, options) {
      const translate = i18next.getFixedT(this.ctx.i18n.language);
      return translate(key, options);
    },
  );

  nunjucksEnv.addFilter("translateToEnglish", function (key, options) {
    const translate = i18next.getFixedT("en");
    return translate(key, options);
  });

  nunjucksEnv.addFilter(
    "translateWithContext",
    function (this: FilterContext, key, context, options) {
      const translate = i18next.getFixedT(this.ctx.i18n.language);

      const pascalContext = kebabCaseToPascalCase(context);

      const fullKey = key + pascalContext;

      return translate(fullKey, options);
    },
  );

  nunjucksEnv.addFilter(
    "translateWithContextOrFallback",
    function (this: FilterContext, key, context, options) {
      const translate = i18next.getFixedT(this.ctx.i18n.language);

      const pascalContext = kebabCaseToPascalCase(context);

      const fullKey = key + pascalContext;

      return translate([fullKey, key], options);
    },
  );

  // allow pushing or adding another attribute to an Object
  nunjucksEnv.addFilter("setAttribute", function (dictionary, key, value) {
    dictionary[key] = value;
    return dictionary;
  });

  nunjucksEnv.addFilter("GDSDate", function (this: FilterContext, formatDate) {
    const dateTransform = new Date(formatDate);
    let dateFormat = "en-GB"; // only using 'en' uses American month-first date formatting
    if (this.ctx.i18n.language === "cy") {
      dateFormat = "cy";
    }
    return dateTransform.toLocaleDateString(dateFormat, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  });

  nunjucksEnv.addFilter(
    "DateDayAndMonth",
    function (this: FilterContext, formatDate) {
      const dateTransform = new Date(formatDate);
      let dateFormat = "en-GB"; // only using 'en' uses American month-first date formatting
      if (this.ctx.i18n.language === "cy") {
        dateFormat = "cy";
      }
      return dateTransform.toLocaleDateString(dateFormat, {
        day: "numeric",
        month: "long",
      });
    },
  );

  // Required by the frontend-ui components
  nunjucksEnv.addGlobal("addLanguageParam", addLanguageParam);
  nunjucksEnv.addGlobal("contactUsUrl", contactUsUrl);
  nunjucksEnv.addGlobal(
    "MAY_2025_REBRAND_ENABLED",
    Config.MAY_2025_REBRAND_ENABLED,
  );
  nunjucksEnv.addGlobal("basePath", __dirname + "/../..");
  return nunjucksEnv;
};
