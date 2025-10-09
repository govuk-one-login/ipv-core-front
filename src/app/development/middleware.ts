import { RequestHandler } from "express";
import sanitize from "sanitize-filename";
import {
  samplePersistedUserDetails,
  generateUserDetails,
} from "../shared/reuseHelper";
import { pageRequiresUserDetails } from "../ipv/middleware";
import { getPhoneType } from "../shared/contextHelper";
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
import {
  frontendUiTranslationCy,
  frontendUiTranslationEn,
} from "@govuk-one-login/frontend-ui";

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
  const pageTemplateTranslations =
    language === "cy" ? frontendUiTranslationCy : frontendUiTranslationEn;

  const renderOptions: Record<string, unknown> = {
    templateId,
    csrfToken: req.csrfToken?.(true),
    context,
    errorState: req.query.errorState,
    pageErrorState: req.query.pageErrorState,
    translations: {
      translation: {
        header: pageTemplateTranslations.header,
        cookieBanner: pageTemplateTranslations.cookieBanner,
        phaseBanner: pageTemplateTranslations.phaseBanner,
        footer: pageTemplateTranslations.footer,
      },
    },
  };

  const errorTemplates = new Set<string>(Object.values(ERROR_PAGES));

  if (errorTemplates.has(templateId)) {
    if (templateId === ERROR_PAGES.SERVICE_UNAVAILABLE) {
      return res.render(getHtmlPath(ERROR_PAGES.SERVICE_UNAVAILABLE));
    }
    return res.render(getErrorPageTemplatePath(templateId), renderOptions);
  }

  if (pageRequiresUserDetails(templateId)) {
    renderOptions.userDetails = generateUserDetails(
      samplePersistedUserDetails,
      req.i18n,
    );
  }

  const phoneType = context ? (context as string) : undefined;

  // 👇 Detect query flags and forward them to the spinner's API URL
  const isSnapshotTest = req.query.snapshotTest === "true";
  const apiUrlParams = new URLSearchParams();

  if (config.ENABLE_PREVIEW) {
    apiUrlParams.set("preview", "true");
  }

  if (isSnapshotTest) {
    apiUrlParams.set("snapshotTest", "true");
  }

  const apiUrl = `${config.API_APP_VC_RECEIPT_STATUS}?${apiUrlParams.toString()}`;

  if (templateId === PAGES.PYI_TRIAGE_DESKTOP_DOWNLOAD_APP) {
    renderOptions.apiUrl = apiUrl;
    renderOptions.msBeforeAbort = config.DAD_SPINNER_REQUEST_TIMEOUT;
    const validPhoneType = getPhoneType(phoneType);
    renderOptions.qrCode = await generateQrCodeImageData(
      getAppStoreRedirectUrl(validPhoneType),
    );
    renderOptions.msBetweenRequests = config.SPINNER_REQUEST_INTERVAL;
    renderOptions.msBeforeInformingOfLongWait =
      config.SPINNER_REQUEST_LONG_WAIT_INTERVAL;
    renderOptions.msBeforeAbort = config.DAD_SPINNER_REQUEST_TIMEOUT;
  } else if (templateId === PAGES.PYI_TRIAGE_MOBILE_DOWNLOAD_APP) {
    const validPhoneType = getPhoneType(phoneType);
    renderOptions.appDownloadUrl = getAppStoreRedirectUrl(validPhoneType);
  } else if (templateId === PAGES.CHECK_MOBILE_APP_RESULT) {
    renderOptions.apiUrl = apiUrl;
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
