import fs from "fs/promises";
import path from "path";
import sanitize from "sanitize-filename";
import { samplePersistedUserDetails, generateUserDetails } from "../shared/reuseHelper";
import { pageRequiresUserDetails } from "../ipv/middleware";
import qrCodeHelper from "../shared/qrCodeHelper";
import appDownloadHelper from "../shared/appDownloadHelper";
import PAGES from "../../constants/ipv-pages";
import { getIpvPageTemplatePath, getTemplatePath } from "../../lib/paths";
import { parseContextAsPhoneType } from "../shared/contextHelper";
import { RequestHandler } from "express";

export const allTemplatesGet: RequestHandler = async (req, res, next) => {
  try {
    const directoryPath = path.resolve("views/ipv/page");

    const templateFiles = await fs.readdir(directoryPath);

    // Convert filenames into radio option objects for the GOVUK Design System nunjucks template
    const templateRadioOptions = templateFiles.map((file) => {
      return { text: path.parse(file).name, value: path.parse(file).name };
    });

    res.render(getTemplatePath("development", "all-templates"), {
      templateRadioOptions: templateRadioOptions,
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    return next(error);
  }
};

export const allTemplatesPost: RequestHandler = async (req, res) => {
  const templateId = req.body.template;
  const language = req.body.language;
  const context = req.body.context;

  let redirectUrl = `/dev/template/${encodeURIComponent(templateId)}/${encodeURIComponent(language)}`;
  if (context) {
    redirectUrl += `?context=${encodeURIComponent(context)}`;
  }

  return res.redirect(redirectUrl);
};

export const templatesDisplayGet: RequestHandler = async (req, res) => {
  const templateId = req.params.templateId;
  const language = req.params.language;
  const context = req.query.context;
  await req.i18n.changeLanguage(language);
  res.locals.currentLanguage = language;

  const renderOptions: Record<string, unknown> = {
    templateId,
    csrfToken: req.csrfToken(),
    context,
    errorState: req.query.errorState,
  };

  if (pageRequiresUserDetails(templateId)) {
    renderOptions.userDetails = generateUserDetails(
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
};
