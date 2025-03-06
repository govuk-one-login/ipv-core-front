import addLanguageParam from "@govuk-one-login/frontend-language-toggle";
import i18next from "i18next";
import nunjucks, { Environment, ConfigureOptions } from "nunjucks";
import path from "path";
import { kebabCaseToPascalCase } from "../app/shared/stringHelper";

export const VIEWS = [
  path.resolve("views/"),
  path.resolve("node_modules/govuk-frontend/dist/"),
  path.resolve("node_modules/@govuk-one-login/"),
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

  // This filter is only used for the phase banner and shouldn't be used for other cases. This is because,
  // when building the static service-unavailable page during the build process, the contactUsUrl is escaped when
  // passed to the i18n's translate function. This isn't the case in the app as i18n is initialised differently,
  // leading to different config. However, as the phase banner is used in the app and for the service-unavailable
  // page to keep it up-to-date with changes, this filter is used in the phase banner to allow the contactUsUrl to
  // be used for both cases.
  nunjucksEnv.addFilter(
    "translateWithoutEscape",
    function (this: FilterContext, key, options) {
      const translate = i18next.getFixedT(this.ctx.i18n.language);
      return translate(key, {
        ...options,
        interpolation: { escapeValue: false },
      });
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

  // Required by the language toggle component
  nunjucksEnv.addGlobal("addLanguageParam", addLanguageParam);
  return nunjucksEnv;
};
