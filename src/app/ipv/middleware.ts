import sanitize from "sanitize-filename";
import { Request, Response } from "express";
import { AxiosResponse } from "axios";
import { NextFunction, RequestHandler } from "express-serve-static-core";
import config from "../../config/config";
import { generateUserDetails, UserDetails } from "../shared/reuseHelper";
import fs from "fs";
import path from "path";
import { saveSessionAndRedirect } from "../shared/redirectHelper";
import {
  getProvenIdentityUserDetails,
  postJourneyEvent,
} from "../../services/coreBackService";
import { generateQrCodeImageData } from "../shared/qrCodeHelper";
import { PHONE_TYPE } from "../../constants/device-constants";
import {
  SUPPORTED_COMBO_EVENTS,
  UNSUPPORTED_COMBO_EVENTS,
  UpdateDetailsOptions,
  UpdateDetailsOptionsWithCancel,
} from "../../constants/update-details-journeys";
import { getAppStoreRedirectUrl } from "../shared/appDownloadHelper";
import {
  getIpvPagePath,
  getIpvPageTemplatePath,
  getTemplatePath,
} from "../../lib/paths";
import PAGES from "../../constants/ipv-pages";
import { getPhoneType } from "../shared/contextHelper";
import {
  detectAppTriageEvent,
  OsType,
  sniffPhoneType,
} from "../shared/deviceSniffingHelper";
import {
  isClientResponse,
  isCriResponse,
  isJourneyResponse,
  isPageResponse,
  isValidClientResponse,
  isValidCriResponse,
  PostJourneyEventResponse,
} from "../validators/postJourneyEventResponse";
import TechnicalError from "../../errors/technical-error";
import BadRequestError from "../../errors/bad-request-error";
import NotFoundError from "../../errors/not-found-error";
import UnauthorizedError from "../../errors/unauthorized-error";
import { HANDLED_ERROR } from "../../lib/logger";
import { sanitiseResponseData } from "../shared/axiosHelper";
import {
  AppVcReceiptStatus,
  getAppVcReceiptStatusAndStoreJourneyResponse,
} from "../vc-receipt-status/middleware";

const directoryPath = path.resolve("views/ipv/page");

const allTemplates = fs
  .readdirSync(directoryPath)
  .map((file) => path.parse(file).name);

const journeyApi = async (
  action: string,
  req: Request,
  currentPageId: string,
): Promise<AxiosResponse<PostJourneyEventResponse>> => {
  if (action.startsWith("/")) {
    action = action.substring(1);
  }

  if (action.startsWith("journey/")) {
    action = action.substring(8);
  }

  return postJourneyEvent(req, action, currentPageId);
};

const fetchUserDetails = async (
  req: Request,
): Promise<UserDetails | undefined> => {
  const userDetailsResponse = await getProvenIdentityUserDetails(req);

  if (!userDetailsResponse.data) {
    return undefined;
  }

  return generateUserDetails(userDetailsResponse.data, req.i18n);
};

export const processAction = async (
  req: Request,
  res: Response,
  action: string,
  currentPageId = "",
): Promise<void> => {
  const backendResponse = await journeyApi(action, req, currentPageId);

  return await handleBackendResponse(req, res, backendResponse);
};

export const handleBackendResponse = async (
  req: Request,
  res: Response,
  backendResponse: AxiosResponse<PostJourneyEventResponse>,
): Promise<void> => {
  const data = backendResponse.data;

  if (isJourneyResponse(data)) {
    return await processAction(req, res, data.journey);
  }

  if (isCriResponse(data) && isValidCriResponse(data)) {
    req.session.currentPage = data.cri.id;
    const redirectUrl = data.cri.redirectUrl;
    return res.redirect(redirectUrl);
  }

  if (isClientResponse(data) && isValidClientResponse(data)) {
    req.session.currentPage = "orchestrator";

    const message = {
      description:
        "Deleting the core-back ipvSessionId and clientOauthSessionId from core-front session",
    };
    req.log.info({ message, level: "INFO", requestId: req.id });

    if (req?.session?.clientOauthSessionId) {
      req.session.clientOauthSessionId = undefined;
    }

    req.session.ipvSessionId = undefined;
    const { redirectUrl } = data.client;
    return saveSessionAndRedirect(req, res, redirectUrl);
  }

  if (isPageResponse(data)) {
    const currentPage = req.session.currentPage;
    if (currentPage) {
      addToSessionHistory(req, currentPage);
    }

    req.session.currentPage = data.page;
    req.session.context = data?.context;
    req.session.currentPageStatusCode = data?.statusCode;

    // Special case handling for "identify-device". This is used by core-back to signal that we need to
    // check the user's device and send back the relevant "appTriage" event.
    if (data.page === PAGES.IDENTIFY_DEVICE) {
      const event = detectAppTriageEvent(req);
      return await processAction(req, res, event, data.page);
    } else {
      return saveSessionAndRedirect(
        req,
        res,
        getIpvPagePath(req.session.currentPage),
      );
    }
  }

  throw new TechnicalError(
    `Unrecognised response type received from core-back: ${JSON.stringify(sanitiseResponseData(backendResponse))}`,
  );
};

const checkJourneyAction = (req: Request): void => {
  if (!req.body?.journey) {
    throw new BadRequestError("journey parameter is required");
  }
};

// getCoiUpdateDetailsJourney determines the next journey based on the detailsToUpdate
// field of the update-details page
const getCoiUpdateDetailsJourney = (
  detailsToUpdate:
    | UpdateDetailsOptionsWithCancel
    | UpdateDetailsOptionsWithCancel[],
): string | undefined => {
  // convert to array if its a string
  if (typeof detailsToUpdate === "string") {
    detailsToUpdate = [detailsToUpdate];
  }

  if (isInvalidDetailsToUpdate(detailsToUpdate)) {
    return;
  }

  const hasAddress = detailsToUpdate.includes("address");
  const hasGivenNames = detailsToUpdate.includes("givenNames");
  const hasFamilyName = detailsToUpdate.includes("familyName");

  if (detailsToUpdate.includes("cancel")) {
    return SUPPORTED_COMBO_EVENTS.UPDATE_CANCEL;
  }

  if (
    detailsToUpdate.includes("dateOfBirth") ||
    (hasGivenNames && hasFamilyName)
  ) {
    detailsToUpdate.sort((a, b) => a.localeCompare(b));
    return detailsToUpdate
      .map(
        (details) => UNSUPPORTED_COMBO_EVENTS[details as UpdateDetailsOptions],
      )
      .join("-");
  }

  if (hasAddress) {
    if (hasFamilyName) {
      return SUPPORTED_COMBO_EVENTS.UPDATE_FAMILY_NAME_ADDRESS;
    } else if (hasGivenNames) {
      return SUPPORTED_COMBO_EVENTS.UPDATE_GIVEN_NAMES_ADDRESS;
    } else {
      return SUPPORTED_COMBO_EVENTS.UPDATE_ADDRESS;
    }
  } else if (hasFamilyName) {
    return SUPPORTED_COMBO_EVENTS.UPDATE_FAMILY_NAME;
  } else if (hasGivenNames) {
    return SUPPORTED_COMBO_EVENTS.UPDATE_GIVEN_NAMES;
  }
};

const isInvalidDetailsToUpdate = (detailsToUpdate: string[]): boolean => {
  return (
    !detailsToUpdate ||
    (detailsToUpdate.includes("cancel") && detailsToUpdate.length > 1)
  );
};

export const pageRequiresUserDetails = (pageId: string): boolean => {
  return [
    PAGES.PAGE_IPV_REUSE,
    PAGES.CONFIRM_DETAILS,
    PAGES.UPDATE_DETAILS,
  ].some((page) => page === pageId);
};

const isValidIpvPage = (pageId: string): boolean => {
  return allTemplates.includes(pageId);
};

export const handleAppStoreRedirect: RequestHandler = (req, res) => {
  const fallbackPhoneType: OsType = { name: req.params.specifiedPhoneType };
  const specifiedPhoneType = sniffPhoneType(req, fallbackPhoneType);

  switch (specifiedPhoneType?.name) {
    case PHONE_TYPE.IPHONE:
      return saveSessionAndRedirect(req, res, config.APP_STORE_URL_APPLE);
    case PHONE_TYPE.ANDROID:
      return saveSessionAndRedirect(req, res, config.APP_STORE_URL_ANDROID);
    default:
      throw new BadRequestError(
        "Unrecognised phone type: " + specifiedPhoneType?.name,
      );
  }
};

const handleUnexpectedPage = async (
  req: Request,
  res: Response,
  pageId: string,
): Promise<void> => {
  req.log?.warn({
    message: {
      description: "pageId does not match session pageId",
      pageId,
      sessionPageId: req.session.currentPage,
    },
  });

  req.session.currentPage = PAGES.PYI_ATTEMPT_RECOVERY;

  return saveSessionAndRedirect(
    req,
    res,
    getIpvPagePath(PAGES.PYI_ATTEMPT_RECOVERY),
  );
};

export const renderAttemptRecoveryPage = async (
  req: Request,
  res: Response,
): Promise<void> => {
  return res.render(getIpvPageTemplatePath(PAGES.PYI_ATTEMPT_RECOVERY), {
    csrfToken: req.csrfToken?.(true),
  });
};

export const staticPageMiddleware = (
  pageId: string,
): ((req: Request, res: Response) => void) => {
  return (req: Request, res: Response) => {
    return res.render(getIpvPageTemplatePath(pageId));
  };
};

const validateSessionAndPage = async (
  req: Request,
  res: Response,
  pageId: string,
): Promise<boolean> => {
  if (!isValidIpvPage(pageId)) {
    throw new NotFoundError("Invalid page id");
  }

  // Check for clientOauthSessionId for recoverable timeout page - specific to cross browser scenario
  if (
    req.session?.clientOauthSessionId &&
    pageId === PAGES.PYI_TIMEOUT_RECOVERABLE
  ) {
    req.session.currentPage = PAGES.PYI_TIMEOUT_RECOVERABLE;
    return true;
  }

  if (!req.session?.ipvSessionId) {
    throw new UnauthorizedError("ipvSessionId is missing");
  }

  // To handle techincal error page JS redirection for DAD page
  if (
    pageId === PAGES.PYI_TIMEOUT_UNRECOVERABLE ||
    (pageId === PAGES.PYI_TECHNICAL &&
      req.session.currentPage === PAGES.PYI_TRIAGE_DESKTOP_DOWNLOAD_APP)
  ) {
    req.session.currentPage = pageId;
    res.render(getIpvPageTemplatePath(pageId));
    return false;
  }

  if (req.session.currentPage !== pageId) {
    await handleUnexpectedPage(req, res, pageId);
    return false;
  }

  return true;
};

export const updateJourneyState: RequestHandler = async (req, res) => {
  const currentPageId = req.params.pageId;
  const action = req.params.action;

  if (action && isValidIpvPage(currentPageId)) {
    await processAction(req, res, action, currentPageId);
  } else {
    throw new NotFoundError("Invalid page id");
  }
};

export const handleJourneyPageRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
  pageErrorState: boolean | undefined = undefined,
): Promise<void> => {
  try {
    const { pageId } = req.params;
    const { context } = req?.session || "";

    // Stop further processing if response has already been handled
    if (!(await validateSessionAndPage(req, res, pageId))) {
      return;
    }

    const renderOptions: Record<string, unknown> = {
      pageId,
      csrfToken: req.csrfToken?.(true),
      context,
      pageErrorState,
    };

    if (pageRequiresUserDetails(pageId)) {
      renderOptions.userDetails = await fetchUserDetails(req);
    } else if (pageId === PAGES.PYI_TRIAGE_DESKTOP_DOWNLOAD_APP) {
      renderOptions.apiUrl = config.API_APP_VC_RECEIPT_STATUS;
      const phoneType = getPhoneType(context);
      const qrCodeUrl = getAppStoreRedirectUrl(phoneType);
      renderOptions.qrCode = await generateQrCodeImageData(qrCodeUrl);
      renderOptions.msBetweenRequests = config.SPINNER_REQUEST_INTERVAL;
      renderOptions.msBeforeInformingOfLongWait =
        config.SPINNER_REQUEST_LONG_WAIT_INTERVAL;
      renderOptions.msBeforeAbort = config.DAD_SPINNER_REQUEST_TIMEOUT;
    } else if (pageId === PAGES.PYI_TRIAGE_MOBILE_DOWNLOAD_APP) {
      const phoneType = getPhoneType(context);
      renderOptions.appDownloadUrl = getAppStoreRedirectUrl(phoneType);
    } else if (pageId === PAGES.PAGE_FACE_TO_FACE_HANDOFF) {
      renderOptions.postOfficeVisitByDate = new Date().setDate(
        new Date().getDate() + config.POST_OFFICE_VISIT_BY_DAYS,
      );
    } else if (req.session.currentPageStatusCode !== undefined) {
      // Set this to avoid pino-http generating a new error in the request log
      res.err = HANDLED_ERROR;
      res.status(req.session.currentPageStatusCode);
    } else if (pageId === PAGES.CHECK_MOBILE_APP_RESULT) {
      renderOptions.apiUrl = config.API_APP_VC_RECEIPT_STATUS;
      renderOptions.msBetweenRequests = config.SPINNER_REQUEST_INTERVAL;
      renderOptions.msBeforeInformingOfLongWait =
        config.SPINNER_REQUEST_LONG_WAIT_INTERVAL;
      renderOptions.msBeforeAbort = config.MAM_SPINNER_REQUEST_TIMEOUT;
    }

    return res.render(getIpvPageTemplatePath(sanitize(pageId)), renderOptions);
  } catch (error) {
    return next(error);
  } finally {
    delete req.session.currentPageStatusCode;
  }
};

export const handleJourneyActionRequest: RequestHandler = async (req, res) => {
  const pageId = req.params.pageId;

  // Stop further processing if response has already been handled
  if (!(await validateSessionAndPage(req, res, pageId))) {
    return;
  }

  // Special case handling for strategic app journey
  if (
    (pageId === PAGES.CHECK_MOBILE_APP_RESULT ||
      pageId === PAGES.PYI_TRIAGE_DESKTOP_DOWNLOAD_APP) &&
    req.session.journey
  ) {
    req.body.journey = req.session.journey;
  }

  checkJourneyAction(req);
  if (req.body?.journey === "contact") {
    return saveSessionAndRedirect(req, res, res.locals.contactUsUrl);
  }

  if (req.body?.journey === "deleteAccount") {
    return saveSessionAndRedirect(req, res, res.locals.deleteAccountUrl);
  }

  await processAction(req, res, req.body.journey, pageId);
};

export const renderFeatureSetPage = async (
  req: Request,
  res: Response,
): Promise<void> => {
  return res.render(getTemplatePath("ipv", "page-featureset"), {
    featureSet: req.session.featureSet,
  });
};

export const checkFormRadioButtonSelected: RequestHandler = async (
  req,
  res,
  next,
) => {
  if (req.body.journey === undefined) {
    await handleJourneyPageRequest(req, res, next, true);
  } else {
    return next();
  }
};

export const checkVcReceiptStatus: RequestHandler = async (req, res, next) => {
  const status = await getAppVcReceiptStatusAndStoreJourneyResponse(req);
  if (status === AppVcReceiptStatus.PROCESSING) {
    await handleJourneyPageRequest(req, res, next, true);
  } else if (status === AppVcReceiptStatus.SERVER_ERROR) {
    throw new Error("Failed to get VC response status");
  } else if (status === AppVcReceiptStatus.CLIENT_ERROR) {
    throw new Error("Failed to get VC response status");
  } else if (status === AppVcReceiptStatus.COMPLETED) {
    return next();
  }
};

export const formHandleUpdateDetailsCheckBox: RequestHandler = async (
  req,
  res,
  next,
) => {
  req.body.journey = getCoiUpdateDetailsJourney(req.body.detailsToUpdate);
  return next();
};

export const formHandleCoiDetailsCheck: RequestHandler = async (
  req,
  res,
  next,
) => {
  const { context, currentPage } = req?.session || {};

  if (!currentPage) {
    throw new TechnicalError("currentPage cannot be empty");
  }
  if (req.body.detailsCorrect === "yes") {
    // user has selected that their details are correct
    req.body.journey = "next";
  } else if (req.body.detailsCorrect === "no" && req.body.detailsToUpdate) {
    // user has chosen details to update - so we set the correct journey
    req.body.journey = getCoiUpdateDetailsJourney(req.body.detailsToUpdate);
  } else if (
    !req.body.detailsCorrect ||
    (req.body.detailsCorrect === "no" && !req.body.detailsToUpdate)
  ) {
    // user has not selected yes/no to their details are correct OR
    // they have selected no but not selected which details to update.
    const renderOptions: Record<string, unknown> = {
      errorState: req.body.detailsCorrect ? "checkbox" : "radiobox",
      pageId: currentPage,
      csrfToken: req.csrfToken?.(true),
      context: context,
    };
    if (pageRequiresUserDetails(currentPage)) {
      renderOptions.userDetails = await fetchUserDetails(req);
    }
    return res.render(getIpvPageTemplatePath(currentPage), renderOptions);
  }
  return next();
};

export const validateFeatureSet: RequestHandler = async (req, res, next) => {
  const featureSet = req.query.featureSet as string;
  const isValidFeatureSet = /^\w{1,32}(,\w{1,32})*$/.test(featureSet);

  if (!isValidFeatureSet) {
    throw new BadRequestError("Invalid feature set ID");
  }

  req.session.featureSet = featureSet;

  return next();
};

// You can use this handler to set req.params.pageId to mimic the `:pageId` path parameter used in the more generic handlers.
export const setRequestPageId = (pageId: string): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    req.params = req.params || {};
    req.params.pageId = pageId;
    return next();
  };
};

export const validatePageId: RequestHandler = (req, res, next) => {
  if (!isValidIpvPage(req.params.pageId)) {
    throw new NotFoundError("Invalid page id");
  }
  return next();
};

const addToSessionHistory = (req: Request, currentPage: string): void => {
  let history = req.session?.history;
  if (!history) {
    history = [currentPage];
    req.session.history = history;
  }
  req.session.history?.push(currentPage);
};
