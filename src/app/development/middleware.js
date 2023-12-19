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

      // Remove the .njk extension from file names
      const templatesWithoutExtension = files.map(
        (file) => path.parse(file).name,
      );

      res.render("development/all-templates.njk", {
        allTemplates: templatesWithoutExtension,
        csrfToken: req.csrfToken(),
      });
    });
  } catch (error) {
    next(error);
  }
}

async function allTemplatesPost(req, res) {
  const pageId = req.body?.template;
  const context = req.body?.context;
  const language = req.body?.language;
  await req.i18n.changeLanguage(language);

  const renderOptions = {
    pageId,
    csrfToken: req.csrfToken(),
    context,
  }

  if (pageId === "page-ipv-reuse") {
    renderOptions["userDetails"] = generateUserDetails(
      samplePersistedUserDetails,
      req.i18n,
    );
  }

  return res.render(`ipv/${sanitize(pageId)}.njk`, renderOptions);
}

module.exports = {
  allTemplatesGet,
  allTemplatesPost,
};
