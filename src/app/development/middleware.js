/* istanbul ignore file */
const fs = require("fs");
const path = require("path");
const sanitize = require("sanitize-filename");
const {
  samplePersistedUserDetails,
  generateUserDetails,
} = require("../shared/reuseHelper");

async function allTemplatesGet(req, res, next) {
  try {
    const directoryPath = __dirname + "/../../views/ipv";

    fs.readdir(directoryPath, function (err, files) {
      if (err) {
        return next(err);
      }

      // Convert filenames into radio option objects for the GOVUK Design System nunjucks template
      const templateRadioOptions = files.map((file) => {
        return { text: path.parse(file).name, value: path.parse(file).name };
      });

      res.render("development/all-templates.njk", {
        templateRadioOptions: templateRadioOptions,
        csrfToken: req.csrfToken(),
      });
    });
  } catch (error) {
    next(error);
  }
}

async function allTemplatesPost(req, res) {
  const templateId = req.body.template;
  const language = req.body.language;
  const context = req.body.context;

  var redirectUrl = `/dev/template/${templateId}/${language}`;

  if (context) {
    redirectUrl += `?context=${context}`;
  }

  return res.redirect(redirectUrl);
}

async function templatesDisplayGet(req, res) {
  const templateId = req.params.templateId;
  const language = req.params.language;
  const context = req.query.context;
  await req.i18n.changeLanguage(language);

  const renderOptions = {
    templateId,
    csrfToken: req.csrfToken(),
    context,
  };

  if (templateId === "page-ipv-reuse") {
    renderOptions["userDetails"] = generateUserDetails(
      samplePersistedUserDetails,
      req.i18n,
    );
  }

  return res.render(`ipv/${sanitize(templateId)}.njk`, renderOptions);
}

// Remove this as part of PYIC-4278
async function allTemplatesMoved(req, res) {
  return res.render(`development/all-templates-moved.njk`);
}

module.exports = {
  allTemplatesGet,
  allTemplatesPost,
  templatesDisplayGet,
  allTemplatesMoved,
};
