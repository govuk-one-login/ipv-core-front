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
import { pagesAndContexts } from "../../test-utils/pages-and-contexts";
import path from "path";

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

export const serviceUnavailableGet: RequestHandler = async (req, res) => {
  res.sendFile(
    path.resolve(
      "views/errors/service-unavailable-s3/service-unavailable.html",
    ),
  );
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
  } else if (templateId === PAGES.PAGE_FACE_TO_FACE_HANDOFF) {
    renderOptions.postOfficeVisitByDate = new Date().setDate(
      new Date().getDate() + 15,
    );
  }

  return res.render(
    getIpvPageTemplatePath(sanitize(templateId)),
    renderOptions,
  );
};
