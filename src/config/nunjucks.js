const nunjucks = require("nunjucks");
const i18next = require("i18next");
const { kebabCaseToPascalCase } = require("../app/shared/stringHelper");
const config = require("../lib/config");

module.exports = {
  configureNunjucks: (app, viewsPath) => {
    const nunjucksEnv = nunjucks.configure(viewsPath, {
      autoescape: true,
      express: app,
      noCache: !config.TEMPLATE_CACHING,
    });

    nunjucksEnv.addFilter("translate", function (key, options) {
      const translate = i18next.getFixedT(this.ctx.i18n.language);
      return translate(key, options);
    });

    nunjucksEnv.addFilter(
      "translateWithContext",
      function (key, context, options) {
        const translate = i18next.getFixedT(this.ctx.i18n.language);

        const pascalContext = kebabCaseToPascalCase(context);

        const fullKey = key + pascalContext;

        return translate(fullKey, options);
      },
    );

    // allow pushing or adding another attribute to an Object
    nunjucksEnv.addFilter("setAttribute", function (dictionary, key, value) {
      dictionary[key] = value;
      return dictionary;
    });

    nunjucksEnv.addFilter("GDSDate", function (formatDate) {
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

    return nunjucksEnv;
  },
};
