const fs = require("fs");
const path = require("path");
const sanitize = require("sanitize-filename");
const { DISPLAY_OUTAGE_BANNER } = require("../../lib/config");
const {
  samplePersistedUserDetails,
  generateUserDetails,
} = require("../shared/reuseHelper");
const { pageRequiresUserDetails } = require("../ipv/middleware");
const qrCodeHelper = require("../shared/qrCodeHelper");
const appDownloadHelper = require("../shared/appDownloadHelper");
const PAGES = require("../../constants/ipv-pages");
const { getIpvPageTemplatePath, getTemplatePath } = require("../../lib/paths");
const { parseContextAsPhoneType } = require("../shared/contextHelper");

async function allTemplatesGet(req, res, next) {
  try {
    const directoryPath = path.resolve("views/ipv/page");

    fs.readdir(directoryPath, function (err, files) {
      if (err) {
        return next(err);
      }

      // Convert filenames into radio option objects for the GOVUK Design System nunjucks template
      const templateRadioOptions = files.map((file) => {
        return { text: path.parse(file).name, value: path.parse(file).name };
      });

      res.render(getTemplatePath("development", "all-templates"), {
        templateRadioOptions: templateRadioOptions,
        csrfToken: req.csrfToken(),
      });
    });
  } catch (error) {
    return next(error);
  }
}

async function allTemplatesPost(req, res) {
  const templateId = req.body.template;
  const language = req.body.language;
  const context = req.body.context;

  let redirectUrl = `/dev/template/${encodeURIComponent(templateId)}/${encodeURIComponent(language)}`;
  if (context) {
    redirectUrl += `?context=${encodeURIComponent(context)}`;
  }

  return res.redirect(redirectUrl);
}

async function templatesDisplayGet(req, res) {
  const templateId = req.params.templateId;
  const language = req.params.language;
  const context = req.query.context;
  await req.i18n.changeLanguage(language);
  res.locals.currentLanguage = language;

  const renderOptions = {
    templateId,
    csrfToken: req.csrfToken(),
    context,
    errorState: req.query.errorState,
    displayOutageBanner: DISPLAY_OUTAGE_BANNER,
  };

  if (pageRequiresUserDetails(templateId)) {
    renderOptions["userDetails"] = generateUserDetails(
      samplePersistedUserDetails,
      req.i18n,
    );
  }
  if (templateId === PAGES.PYI_TRIAGE_DESKTOP_DOWNLOAD_APP) {
    renderOptions.qrCode = await qrCodeHelper.generateQrCodeImageData(
      appDownloadHelper.getAppStoreRedirectUrl(
        parseContextAsPhoneType(context),
      ),
    );
  } else if (templateId === PAGES.PYI_TRIAGE_MOBILE_DOWNLOAD_APP) {
    renderOptions.appDownloadUrl = appDownloadHelper.getAppStoreRedirectUrl(
      parseContextAsPhoneType(context),
    );
  }

  return res.render(
    getIpvPageTemplatePath(sanitize(templateId)),
    renderOptions,
  );
}

module.exports = {
  allTemplatesGet,
  allTemplatesPost,
  templatesDisplayGet,
};
