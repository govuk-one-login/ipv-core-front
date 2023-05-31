const nunjucks = require("nunjucks");
const i18next = require("i18next");

module.exports = {
  configureNunjucks: (app, viewsPath) => {
    const nunjucksEnv = nunjucks.configure(viewsPath, {
      autoescape: true,
      express: app,
      noCache: true,
    });

    nunjucksEnv.addFilter("translate", function (key, options) {
      const translate = i18next.getFixedT(this.ctx.i18n.language);
      return translate(key, options);
    });

    nunjucksEnv.addFilter("GDSDate", function(formatDate){
      let dateTransform = new Date(formatDate);
      let dateFormat = 'en-GB'; // only using 'en' uses American month-first date formatting
      if(this.ctx.i18n.language==="cy"){
             dateFormat='cy';
      }
      return dateTransform.toLocaleDateString(dateFormat,{day:'numeric', month: 'long', year:'numeric' });
    })

    return nunjucksEnv;
  },
};
