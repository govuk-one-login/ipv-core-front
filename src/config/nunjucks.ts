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

function getPageContextValue(
  pageContext: Record<string, unknown>,
  contextKey: string,
): string | null {
  if (!pageContext) return null;

  const contextValue = pageContext[contextKey];

  if (typeof contextValue == "boolean") {
    // If the context is a boolean flag and it exists, the context is still
    // valid (hence we don't return null) but we only want to enable it
    // if the flag is set to true
    return contextValue ? kebabCaseToPascalCase(contextKey) : "";
  }

  if (typeof contextValue == "string") {
    return kebabCaseToPascalCase(contextValue);
  }

  return null;
}

export const configureNunjucks = (
  nunjucksOptions: ConfigureOptions = {},
  appViews: string[] = VIEWS,
): Environment => {
  const nunjucksEnv = nunjucks.configure(appViews, {
    autoescape: true,
    ...nunjucksOptions,
  });

  // Note: this is used by frontend-ui
  nunjucksEnv.addFilter(
    "translate",
    function (this: FilterContext, key, options) {
      const translate = i18next.getFixedT(this.ctx.i18n.language);
      return translate(key, options);
    },
  );

  // Note: this is used by frontend-ui
  nunjucksEnv.addFilter("translateToEnglish", function (key, options) {
    const translate = i18next.getFixedT("en");
    return translate(key, options);
  });

  /**
   * If context:
   *   - does not exist in the pageContext object
   *   - has a boolean value, but it's false
   *  then, fallback to the translation without the context
   */
  nunjucksEnv.addFilter(
    "translateWithPageContextOrFallback",
    function (
      this: FilterContext,
      key: string,
      pageContext: Record<string, unknown>,
      contextKey: string,
      options,
    ) {
      const translate = i18next.getFixedT(this.ctx.i18n.language);
      const contextValue = getPageContextValue(pageContext, contextKey) || "";
      return translate([key + contextValue, key], options);
    },
  );

  /**
   * If context:
   *   - does not exist in the pageContext object
   *   - has a boolean value, but it's false
   *  then throw an error as there is no fallback
   */
  nunjucksEnv.addFilter(
    "translateWithPageContext",
    function (
      this: FilterContext,
      key: string,
      pageContext: Record<string, unknown>,
      contextKey: string,
      options,
    ) {
      const translate = i18next.getFixedT(this.ctx.i18n.language);
      const contextValue = getPageContextValue(pageContext, contextKey);
      if (!contextValue) {
        throw new Error(
          `Context key ${contextKey} does not exist in pageContext object`,
        );
      }

      return translate(key + contextValue, options);
    },
  );

  nunjucksEnv.addFilter(
    "fullKeyWithContext",
    function (
      this: FilterContext,
      key: string,
      pageContext: Record<string, unknown>,
      contextKey: string,
    ) {
      const contextValue = getPageContextValue(pageContext, contextKey) || "";
      return key + contextValue;
    },
  );

  nunjucksEnv.addFilter(
    "addUriEncodedPageContext",
    function (
      this: FilterContext,
      uri: string,
      pageContext: Record<string, unknown>,
    ) {
      return (
        uri + `?pageContext=${encodeURIComponent(JSON.stringify(pageContext))}`
      );
    },
  );

  nunjucksEnv.addFilter("jsonToList", function (str: string) {
    try {
      const parsed = JSON.parse(str.trim().replaceAll(/^'|'$/g, ""));
      const items = Object.entries(parsed)
        .map(([k, v]) => `<li>${k}: ${v}</li>`)
        .join("");
      return `<ul>${items}</ul>`;
    } catch {
      return str;
    }
  });

  // TODO PYIC-8718: remove this once the ipv-core-base.njk file for core in frontend-ui
  // has been updated to remove the use of translateWithContextOrFallback
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
