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
import { pagesAndContexts } from "../../test-utils/pages-and-contexts";

interface RadioOption {
  text: string;
  value: string;
}

let templates: string[];
const templatesWithContextRadioOptions: Record<
  keyof typeof pagesAndContexts,
  RadioOption[]
> = {};

export const allTemplatesGet: RequestHandler = async (req, res) => {
  const directoryPath = path.resolve("views/ipv/page");

  // Load available templates and convert into radio option objects for the GOV.UK Design System nunjucks template
  if (!config.TEMPLATE_CACHING || !templates) {
    const templateFiles = await fs.readdir(directoryPath);
    templates = templateFiles.map((file) => path.parse(file).name);
  }

  // Get all contexts for all pages and map to radio option objects for the GOV.UK Design System nunjucks template
  for (const page in pagesAndContexts) {
    templatesWithContextRadioOptions[page] = pagesAndContexts[page].map(
      (context) => ({
        text: context || "No context",
        value: context || "",
      }),
    );
  }

  res.render(getTemplatePath("development", "all-templates"), {
    templatesWithContextRadioOptions: templatesWithContextRadioOptions,
    csrfToken: req.csrfToken?.(true),
  });
};

export const checkRequiredOptionsAreSelected: RequestHandler = async (
  req,
  res,
  next,
) => {
  if (
    req.body.template === undefined ||
    (templatesWithContextRadioOptions[req.body.template].length > 0 &&
      req.body.pageContext === undefined)
  ) {
    res.locals.allTemplatesPageError = true;
  }
  return next();
};

export const allTemplatesPost: RequestHandler = async (req, res) => {
  if (res.locals.allTemplatesPageError) {
    return res.render(getTemplatePath("development", "all-templates"), {
      templatesWithContextRadioOptions: templatesWithContextRadioOptions,
      csrfToken: req.csrfToken?.(true),
      errorState: true,
    });
  }

  const templateId = req.body.template;
  const language = req.body.language;
  const context = req.body.pageContext;
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
