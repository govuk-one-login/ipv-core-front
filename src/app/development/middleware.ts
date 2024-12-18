import fs from "fs/promises";
import path from "path";
import { RequestHandler } from "express";
import sanitize from "sanitize-filename";
import {
  samplePersistedUserDetails,
  generateUserDetails,
} from "../shared/reuseHelper";
import { pageRequiresUserDetails } from "../ipv/middleware";
import { validatePhoneType } from "../shared/contextHelper";
import { generateQrCodeImageData } from "../shared/qrCodeHelper";
import { getAppStoreRedirectUrl } from "../shared/appDownloadHelper";
import PAGES from "../../constants/ipv-pages";
import { getIpvPageTemplatePath, getTemplatePath } from "../../lib/paths";
import config from "../../config/config";

interface RadioOption {
  text: string;
  value: string;
}

let templateRadioOptions: RadioOption[];

export const allTemplatesGet: RequestHandler = async (req, res) => {
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
};

export const allTemplatesPost: RequestHandler = async (req, res) => {
  const templateId = req.body.template;
  const language = req.body.language;
  const context = req.body.context;
  const hasErrorState = req.body.hasErrorState;

  let redirectUrl = `/dev/template/${encodeURIComponent(templateId)}/${encodeURIComponent(language)}`;
  if (context || hasErrorState) {
    const queryParams: [string, string][] = [];
    if (context) {
      queryParams.push(["context", encodeURIComponent(context)]);
    }
    if (hasErrorState) {
      queryParams.push(["pageErrorState", "true"]);
    }
    redirectUrl +=
      "?" + queryParams.map(([key, value]) => `${key}=${value}`).join("&");
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
    pageErrorState: req.query.pageErrorState,
  };

  if (pageRequiresUserDetails(templateId)) {
    renderOptions.userDetails = generateUserDetails(
      samplePersistedUserDetails,
      req.i18n,
    );
  }
  const phoneType = context ? (context as string) : undefined;
  if (templateId === PAGES.PYI_TRIAGE_DESKTOP_DOWNLOAD_APP) {
    validatePhoneType(phoneType);
    renderOptions.qrCode = await generateQrCodeImageData(
      getAppStoreRedirectUrl(phoneType),
    );
  } else if (templateId === PAGES.PYI_TRIAGE_MOBILE_DOWNLOAD_APP) {
    validatePhoneType(phoneType);
    renderOptions.appDownloadUrl = getAppStoreRedirectUrl(phoneType);
  }

  return res.render(
    getIpvPageTemplatePath(sanitize(templateId)),
    renderOptions,
  );
};
