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
import {
  DevTemplatePages,
  NO_CONTEXT_VARIANT,
  pagesAndContexts,
} from "../../test-utils/pages-and-contexts";
import ERROR_PAGES from "../../constants/error-pages";
import config from "../../config/config";
import {
  frontendUiTranslationCy,
  frontendUiTranslationEn,
} from "@govuk-one-login/frontend-ui";
import { getTypedPageContext } from "../../types/page-contexts";

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

const getMappedPageContextRadioOptions = (): Record<string, RadioOption[]> => {
  const templatesWithContextRadioOptions: Record<string, RadioOption[]> = {};

  // Get all contexts for all pages and map to radio option objects for the GOV.UK Design System nunjucks template
  for (const [page, contexts] of Object.entries(pagesAndContexts)) {
    templatesWithContextRadioOptions[page] = contexts.map(
      (contextLabelAndValue) => {
        if (contextLabelAndValue === NO_CONTEXT_VARIANT) {
          return { text: "No context", value: "" };
        }

        const label = Object.keys(contextLabelAndValue)[0];
        return {
          text: label,
          value: JSON.stringify(contextLabelAndValue[label]),
        };
      },
    );
  }

  return templatesWithContextRadioOptions;
};

export const allTemplatesPost: RequestHandler = async (req, res) => {
  const pageContext = req.body.pageContext;
  const templateId = req.body.template
    ? (req.body.template as DevTemplatePages)
    : undefined;

  if (
    templateId === undefined ||
    (pagesAndContexts[templateId].length > 0 && pageContext === undefined)
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
  if (pageContext || hasErrorState) {
    const queryParams: [string, string][] = [];
    if (pageContext) {
      queryParams.push(["pageContext", encodeURIComponent(pageContext)]);
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
  const pageContext = req.query.pageContext
    ? JSON.parse(req.query.pageContext as string)
    : undefined;

  await req.i18n.changeLanguage(language);
  res.locals.currentLanguage = language;
  const pageTemplateTranslations =
    language === "cy" ? frontendUiTranslationCy : frontendUiTranslationEn;

  const renderOptions: Record<string, unknown> = {
    templateId,
    csrfToken: req.csrfToken?.(true),
    pageContext,
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
    const smartphone = getTypedPageContext(templateId, pageContext)?.smartphone;
    const validPhoneType = getPhoneType(smartphone);
    renderOptions.qrCode = await generateQrCodeImageData(
      getAppStoreRedirectUrl(validPhoneType),
    );
    renderOptions.msBetweenRequests = config.SPINNER_REQUEST_INTERVAL;
    renderOptions.msBeforeInformingOfLongWait =
      config.SPINNER_REQUEST_LONG_WAIT_INTERVAL;
    renderOptions.msBeforeAbort = config.DAD_SPINNER_REQUEST_TIMEOUT;
  } else if (templateId === PAGES.PYI_TRIAGE_MOBILE_DOWNLOAD_APP) {
    const smartphone = getTypedPageContext(templateId, pageContext)?.smartphone;
    const validPhoneType = getPhoneType(smartphone);
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
