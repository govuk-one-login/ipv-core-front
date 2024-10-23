import fs from "fs/promises";
import path from "path";
import { RequestHandler } from "express";
import sanitize from "sanitize-filename";
import {
  samplePersistedUserDetails,
  generateUserDetails,
} from "../shared/reuseHelper";
import { pageRequiresUserDetails } from "../ipv/middleware";
import { parseContextAsPhoneType } from "../shared/contextHelper";
import { generateQrCodeImageData } from "../shared/qrCodeHelper";
import { getAppStoreRedirectUrl } from "../shared/appDownloadHelper";
import PAGES from "../../constants/ipv-pages";
import { getIpvPageTemplatePath, getTemplatePath } from "../../lib/paths";
import config from "../../lib/config";

interface RadioOption {
  text: string;
  value: string;
}

let templateRadioOptions: RadioOption[];

export const allTemplatesGet: RequestHandler = async (req, res, next) => {
  try {
    const directoryPath = path.resolve("views/ipv/page");

    // Load available templates and convert into radio option objects for the GOV.UK Design System nunjucks template
    if (!config.TEMPLATE_CACHING || !templateRadioOptions) {
      const templateFiles = await fs.readdir(directoryPath);
      templateRadioOptions = templateFiles.map((file) => ({
        text: path.parse(file).name,
        value: path.parse(file).name,
      }));
    }

    res.render(getTemplatePath("development", "all-templates"), {
      templateRadioOptions: templateRadioOptions,
      csrfToken: req.csrfToken?.(true),
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
    csrfToken: req.csrfToken?.(true),
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
    renderOptions.qrCode = await generateQrCodeImageData(
      getAppStoreRedirectUrl(
        parseContextAsPhoneType(context ? (context as string) : undefined),
      ),
    );
  } else if (templateId === PAGES.PYI_TRIAGE_MOBILE_DOWNLOAD_APP) {
    renderOptions.appDownloadUrl = getAppStoreRedirectUrl(
      parseContextAsPhoneType(context ? (context as string) : undefined),
    );
  }

  return res.render(
    getIpvPageTemplatePath(sanitize(templateId)),
    renderOptions,
  );
};
