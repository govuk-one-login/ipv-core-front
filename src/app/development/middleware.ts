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
import {
  getErrorPageTemplatePath,
  getHtmlPath,
  getIpvPageTemplatePath,
  getTemplatePath,
} from "../../lib/paths";
import { pagesAndContexts } from "../../test-utils/pages-and-contexts";
import ERROR_PAGES from "../../constants/error-pages";
import config from "../../config/config";

interface RadioOption {
  text: string;
  value: string;
}

export const allTemplatesGet: RequestHandler = async (req, res) => {
  const templatesWithContextRadioOptions = getMappedPageContextRadioOptions();
  res.render(getTemplatePath("development", "all-templates"), {
    templatesWithContextRadioOptions: templatesWithContextRadioOptions,
    csrfToken: req.csrfToken?.(true),
  });
};

const getMappedPageContextRadioOptions = (): Record<
  keyof typeof pagesAndContexts,
  RadioOption[]
> => {
  const templatesWithContextRadioOptions: Record<
    keyof typeof pagesAndContexts,
    RadioOption[]
  > = {};

  // Get all contexts for all pages and map to radio option objects for the GOV.UK Design System nunjucks template
  for (const [page, contexts] of Object.entries(pagesAndContexts)) {
    templatesWithContextRadioOptions[page] = contexts.map((context) => ({
      text: context ?? "No context",
      value: context ?? "",
    }));
  }

  return templatesWithContextRadioOptions;
};

export const allTemplatesPost: RequestHandler = async (req, res) => {
  const context = req.body.pageContext;
  const templateId = req.body.template;

  if (
    templateId === undefined ||
    (pagesAndContexts[req.body.template].length > 0 && context === undefined)
  ) {
    const templatesWithContextRadioOptions = getMappedPageContextRadioOptions();

    return res.render(getTemplatePath("development", "all-templates"), {
      templatesWithContextRadioOptions: templatesWithContextRadioOptions,
      csrfToken: req.csrfToken?.(true),
      errorState: true,
    });
  }

  const language = req.body.language;
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

  const errorTemplates = new Set<string>(
    Object.values(ERROR_PAGES).filter(
      (p) => p !== ERROR_PAGES.SERVICE_UNAVAILABLE,
    ),
  );

  if (errorTemplates.has(templateId)) {
    return res.render(getErrorPageTemplatePath(templateId), renderOptions);
  }

  if (pageRequiresUserDetails(templateId)) {
    renderOptions.userDetails = generateUserDetails(
      samplePersistedUserDetails,
      req.i18n,
    );
  }

  const phoneType = context ? (context as string) : undefined;

  if (templateId === PAGES.PYI_TRIAGE_DESKTOP_DOWNLOAD_APP) {
    renderOptions.msBeforeAbort = config.DAD_SPINNER_REQUEST_TIMEOUT;
    validatePhoneType(phoneType);
    renderOptions.qrCode = await generateQrCodeImageData(
      getAppStoreRedirectUrl(phoneType),
    );
    renderOptions.msBetweenRequests = config.SPINNER_REQUEST_INTERVAL;
    renderOptions.msBeforeInformingOfLongWait =
      config.SPINNER_REQUEST_LONG_WAIT_INTERVAL;
    renderOptions.msBeforeAbort = config.DAD_SPINNER_REQUEST_TIMEOUT;
  } else if (templateId === PAGES.PYI_TRIAGE_MOBILE_DOWNLOAD_APP) {
    validatePhoneType(phoneType);
    renderOptions.appDownloadUrl = getAppStoreRedirectUrl(phoneType);
  } else if (templateId === PAGES.CHECK_MOBILE_APP_RESULT) {
    renderOptions.msBetweenRequests = config.SPINNER_REQUEST_INTERVAL;
    renderOptions.msBeforeAbort = config.MAM_SPINNER_REQUEST_TIMEOUT;
    renderOptions.msBeforeInformingOfLongWait =
      config.SPINNER_REQUEST_LONG_WAIT_INTERVAL;
  } else if (templateId === PAGES.PAGE_FACE_TO_FACE_HANDOFF) {
    const defaultDate = new Date("2025-04-01");
    renderOptions.postOfficeVisitByDate = defaultDate.setDate(
      defaultDate.getDate() + config.POST_OFFICE_VISIT_BY_DAYS,
    );
  }

  return res.render(
    getIpvPageTemplatePath(sanitize(templateId)),
    renderOptions,
  );
};

export const serviceUnavailableGet: RequestHandler = (req, res) => {
  res.render(getHtmlPath(ERROR_PAGES.SERVICE_UNAVAILABLE));
};
