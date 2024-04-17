const fs = require("fs");
const path = require("path");
const sanitize = require("sanitize-filename");
const {
  samplePersistedUserDetails,
  generateUserDetails,
} = require("../shared/reuseHelper");
const { pageRequiresUserDetails } = require("../ipv/middleware");
const qrCodeHelper = require("../shared/qrCodeHelper");
const PHONE_TYPES = require("../../constants/phone-types");
const appDownloadHelper = require("../shared/appDownloadHelper");
const PAGES = require("../../constants/ipvPages");
const { getIpvPageTemplatePath, addNunjucksExt } = require("../../lib/paths");

async function allTemplatesGet(req, res, next) {
  try {
    const directoryPath = path.join(__dirname, "/../../views/ipv/page");

    fs.readdir(directoryPath, function (err, files) {
      if (err) {
        return next(err);
      }

      // Convert filenames into radio option objects for the GOVUK Design System nunjucks template
      const templateRadioOptions = files.map((file) => {
        return { text: path.parse(file).name, value: path.parse(file).name };
      });

      res.render(path.join("development", addNunjucksExt("all-templates")), {
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

  let redirectUrl = path.join("/", "dev", "template", templateId, language);
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

  if (pageRequiresUserDetails(templateId)) {
    renderOptions["userDetails"] = generateUserDetails(
      samplePersistedUserDetails,
      req.i18n,
    );
  }
  if (templateId === PAGES.PYI_TRIAGE_DESKTOP_DOWNLOAD_APP) {
    renderOptions.qrCode = await qrCodeHelper.generateQrCodeImageData(
      appDownloadHelper.getAppStoreRedirectUrl(PHONE_TYPES.IPHONE),
    );
  } else if (templateId === PAGES.PYI_TRIAGE_MOBILE_DOWNLOAD_APP) {
    renderOptions.appDownloadUrl = appDownloadHelper.getAppStoreRedirectUrl(
      PHONE_TYPES.IPHONE,
    );
  }

  return res.render(
    getIpvPageTemplatePath(sanitize(templateId)),
    renderOptions,
  );
}

// Remove this as part of PYIC-4278
async function allTemplatesMoved(req, res) {
  return res.render(
    path.join("development", addNunjucksExt("all-templates-moved")),
  );
}

module.exports = {
  allTemplatesGet,
  allTemplatesPost,
  templatesDisplayGet,
  allTemplatesMoved,
};
