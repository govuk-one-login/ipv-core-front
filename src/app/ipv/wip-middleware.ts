import sanitize from "sanitize-filename";
import config from "../../lib/config";
import {
  buildCredentialIssuerRedirectURL,
  redirectToAuthorize,
} from "../shared/criHelper";
import {
  logError,
  logCoreBackCall,
  transformError,
} from "../shared/loggerHelper";
import {
  LOG_COMMUNICATION_TYPE_REQUEST,
  LOG_TYPE_JOURNEY,
} from "../shared/loggerConstants";

import { generateUserDetails } from "../shared/reuseHelper";
import { HTTP_STATUS_CODES } from "../../app.constants";
import fs from "fs";
import path from "path";
import { saveSessionAndRedirect } from "../shared/redirectHelper";
import {
  PostJourneyEventResponse,
  postJourneyEvent,
  getProvenIdentityUserDetails,
  CriResponse,
  ClientResponse,
  JourneyResponse,
  PageResponse,
} from "../../services/coreBackService";
import qrCodeHelper from "../shared/qrCodeHelper";
import PHONE_TYPES from "../../constants/phone-types";
import {
  SUPPORTED_COMBO_EVENTS,
  UNSUPPORTED_COMBO_EVENTS,
  UpdateDetailsOptions,
  UpdateDetailsOptionsWithCancel,
} from "../../constants/update-details-journeys";
import appDownloadHelper from "../shared/appDownloadHelper";
import {
  getIpvPageTemplatePath,
  getIpvPagePath,
  getTemplatePath,
  getErrorPageTemplatePath,
} from "../../lib/paths";
import PAGES from "../../constants/ipv-pages";
import { parseContextAsPhoneType } from "../shared/contextHelper";
import {
  sniffPhoneType,
  detectAppTriageEvent,
} from "../shared/deviceSniffingHelper";
import ERROR_PAGES from "../../constants/error-pages";
import { Request, Response } from "express";
import { AxiosError, AxiosResponse } from "axios";
import { NextFunction, RequestHandler } from "express-serve-static-core";

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
    action = action.substr(1);
  }

  if (action.startsWith("journey/")) {
    action = action.substr(8);
  }

  logCoreBackCall(req, {
    logCommunicationType: LOG_COMMUNICATION_TYPE_REQUEST,
    type: LOG_TYPE_JOURNEY,
    path: action,
  });

  return postJourneyEvent(req, action, currentPageId);
};

const fetchUserDetails = async (req: Request) => {
  const userDetailsResponse = await getProvenIdentityUserDetails(req);

  return generateUserDetails(userDetailsResponse, req.i18n);
};

const isJourneyResponse = (
  res: PostJourneyEventResponse,
): res is JourneyResponse => {
  return (res as JourneyResponse).journey !== undefined;
};

const isCriResponse = (res: PostJourneyEventResponse): res is CriResponse => {
  return (res as CriResponse).cri !== undefined;
};

const isClientResponse = (
  res: PostJourneyEventResponse,
): res is ClientResponse => {
  return (res as ClientResponse).client !== undefined;
};

const isPageResponse = (res: PostJourneyEventResponse): res is PageResponse => {
  return (res as PageResponse).page !== undefined;
};

export const processAction = async (
  req: Request,
  res: Response,
  action: string,
  currentPageId = "",
) => {
  const backendResponse = (await journeyApi(action, req, currentPageId)).data;

  return await handleBackendResponse(req, res, backendResponse);
};

export const handleBackendResponse = async (
  req: Request,
  res: Response,
  backendResponse: PostJourneyEventResponse,
): Promise<void> => {
  if (isJourneyResponse(backendResponse)) {
    return await processAction(req, res, backendResponse.journey);
  }

  if (
    isCriResponse(backendResponse) &&
    isValidCriResponse(backendResponse)
  ) {
    req.cri = backendResponse.cri;
    req.session.currentPage = req.cri.id;
    await buildCredentialIssuerRedirectURL(req, res);
    return redirectToAuthorize(req, res);
  }

  if (
    isClientResponse(backendResponse) &&
    isValidClientResponse(backendResponse)
  ) {
    req.session.currentPage = "orchestrator";

    const message = {
      description:
        "Deleting the core-back ipvSessionId and clientOauthSessionId from core-front session",
    };
    req.log.info({ message, level: "INFO", requestId: req.id });

    if (req?.session?.clientOauthSessionId) {
      req.session.clientOauthSessionId = null;
    }

    req.session.ipvSessionId = null;
    const { redirectUrl } = backendResponse.client;
    return saveSessionAndRedirect(req, res, redirectUrl);
  }

  if (isPageResponse(backendResponse)) {
    req.session.currentPage = backendResponse.page;
    req.session.context = backendResponse?.context;
    req.session.currentPageStatusCode = backendResponse?.statusCode;

    // Special case handling for "identify-device". This is used by core-back to signal that we need to
    // check the user's device and send back the relevant "appTriage" event.
    if (backendResponse.page === PAGES.IDENTIFY_DEVICE) {
      const event = detectAppTriageEvent(req);
      return await processAction(req, res, event, backendResponse.page);
    } else {
      return saveSessionAndRedirect(
        req,
        res,
        getIpvPagePath(req.session.currentPage),
      );
    }
  }

  const message = {
    description: "Unexpected backend response",
    data: backendResponse,
  };
  req.log.error({ message, level: "ERROR" });
  throw new Error(message.description);

};

const isValidCriResponse = (criResponse: CriResponse) => {
  if (!criResponse.cri.redirectUrl) {
    throw new Error("CRI response RedirectUrl is missing");
  }

  return true;
}

const isValidClientResponse = (client: ClientResponse) => {
  const {
    client: { redirectUrl },
  } = client;

  if (!redirectUrl) {
    throw new Error("Client Response redirect url is missing");
  }

  return true;
}

const checkForIpvAndOauthSessionId = (req: Request, res: Response) => {
  if (!req.session?.ipvSessionId && !req.session?.clientOauthSessionId) {
    const err = new AxiosError(
      "req.ipvSessionId and req.clientOauthSessionId are both missing",
    );
    err.status = HTTP_STATUS_CODES.UNAUTHORIZED;
    logError(req, err);

    return renderTechnicalError(req, res);
  }
}

const checkJourneyAction = (req: Request) => {
  if (!req.body?.journey) {
    const err = new AxiosError("req.body?.journey is missing");
    err.status = HTTP_STATUS_CODES.BAD_REQUEST;
    logError(req, err);

    throw new Error("req.body?.journey is missing");
  }
};

// getCoiUpdateDetailsJourney determines the next journey based on the detailsToUpdate
// field of the update-details page
const getCoiUpdateDetailsJourney = (detailsToUpdate: UpdateDetailsOptionsWithCancel | UpdateDetailsOptionsWithCancel[]) => {
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
    return detailsToUpdate
      .sort()
      .map((details) => UNSUPPORTED_COMBO_EVENTS[details as UpdateDetailsOptions])
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
}

function isInvalidDetailsToUpdate(detailsToUpdate: string[]) {
  return (
    !detailsToUpdate ||
    (detailsToUpdate.includes("cancel") && detailsToUpdate.length > 1)
  );
}

export const pageRequiresUserDetails = (pageId: string) => {
  return [
    PAGES.PAGE_IPV_REUSE,
    PAGES.CONFIRM_DETAILS,
    PAGES.UPDATE_DETAILS,
  ].some(page => page === pageId);
};

const isValidIpvPage = (pageId: string) => {
  return allTemplates.includes(pageId);
}

export const handleAppStoreRedirect: RequestHandler = (req, res, next) => {
  const specifiedPhoneType = sniffPhoneType(req, req.params.specifiedPhoneType);

  try {
    switch (specifiedPhoneType) {
      case PHONE_TYPES.IPHONE:
        return saveSessionAndRedirect(req, res, config.APP_STORE_URL_APPLE);
      case PHONE_TYPES.ANDROID:
        return saveSessionAndRedirect(req, res, config.APP_STORE_URL_ANDROID);
      default:
        throw new Error("Unrecognised phone type: " + specifiedPhoneType);
    }
  } catch (error) {
    transformError(error, "Error redirecting to app store");
    return next(error);
  }
}

const handleUnexpectedPage = async (req: Request, res: Response, pageId: string) => {
  logError(
    req,
    {
      pageId: pageId,
      expectedPage: req.session.currentPage,
    },
    "page :pageId doesn't match expected session page :expectedPage",
  );

  req.session.currentPage = PAGES.PYI_ATTEMPT_RECOVERY;

  return saveSessionAndRedirect(
    req,
    res,
    getIpvPagePath(PAGES.PYI_ATTEMPT_RECOVERY),
  );
}

const render404 = (response: Response) => {
  response.status(HTTP_STATUS_CODES.NOT_FOUND);
  return response.render(getErrorPageTemplatePath(ERROR_PAGES.PAGE_NOT_FOUND));
}

const renderTechnicalError = (request: Request, response: Response) => {
  request.session.currentPage = PAGES.PYI_TECHNICAL;
  response.status(HTTP_STATUS_CODES.UNAUTHORIZED);
  return response.render(getIpvPageTemplatePath(PAGES.PYI_TECHNICAL), {
    context: "unrecoverable",
  });
}

const renderAttemptRecoveryPage = async (req: Request, res: Response) => {
  return res.render(getIpvPageTemplatePath(PAGES.PYI_ATTEMPT_RECOVERY), {
    csrfToken: req.csrfToken(),
  });
}

export const staticPageMiddleware = (pageId: string) => {
  return (req: Request, res: Response) => {
    return res.render(getIpvPageTemplatePath(pageId));
  };
}

const validateSessionAndPage = async (req: Request, res: Response, pageId: string) => {
  if (!isValidIpvPage(pageId)) {
    render404(res);
    return false;
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
    logError(
      req,
      {
        pageId: pageId,
        expectedPage: req.session?.currentPage,
      },
      "req.ipvSessionId is null",
    );

    renderTechnicalError(req, res);
    return false;
  }

  if (pageId === PAGES.PYI_TIMEOUT_UNRECOVERABLE) {
    req.session.currentPage = PAGES.PYI_TIMEOUT_UNRECOVERABLE;
    res.render(getIpvPageTemplatePath(req.session.currentPage));
    return false;
  }

  if (req.session.currentPage !== pageId) {
    await handleUnexpectedPage(req, res, pageId);
    return false;
  }

  return true;
}

export const updateJourneyState: RequestHandler = async (req, res, next) => {
  try {
    const currentPageId = req.params.pageId;
    const action = req.params.action;

    if (action && isValidIpvPage(currentPageId)) {
      await processAction(req, res, action, currentPageId);
    } else {
      return render404(res);
    }
  } catch (error) {
    return next(error);
  }
}

export const handleJourneyPageRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
  pageErrorState: boolean | undefined = undefined,
) => {
  try {
    const { pageId } = req.params;
    const { context } = req?.session || "";

    // Stop further processing if response has already been handled
    if (!(await validateSessionAndPage(req, res, pageId))) {
      return;
    }

    const renderOptions: Record<string, unknown> = {
      pageId,
      csrfToken: req.csrfToken(),
      context,
      pageErrorState,
    };

    if (pageRequiresUserDetails(pageId)) {
      renderOptions.userDetails = await fetchUserDetails(req);
    } else if (pageId === PAGES.PYI_TRIAGE_DESKTOP_DOWNLOAD_APP) {
      const qrCodeUrl = appDownloadHelper.getAppStoreRedirectUrl(
        parseContextAsPhoneType(context),
      );
      renderOptions.qrCode =
        await qrCodeHelper.generateQrCodeImageData(qrCodeUrl);
    } else if (pageId === PAGES.PYI_TRIAGE_MOBILE_DOWNLOAD_APP) {
      renderOptions.appDownloadUrl = appDownloadHelper.getAppStoreRedirectUrl(
        parseContextAsPhoneType(context),
      );
    } else if (req.session.currentPageStatusCode !== undefined) {
      res.status(parseInt(req.session.currentPageStatusCode) || HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
    }

    return res.render(getIpvPageTemplatePath(sanitize(pageId)), renderOptions);
  } catch (error) {
    transformError(error, `error handling journey page: ${req.params}`);
    return next(error);
  } finally {
    delete req.session.currentPageStatusCode;
  }
}

export const handleJourneyActionRequest: RequestHandler = async (req, res, next) => {
  const pageId = req.params.pageId;

  try {
    // Stop further processing if response has already been handled
    if (!(await validateSessionAndPage(req, res, pageId))) {
      return;
    }

    checkJourneyAction(req);
    if (req.body?.journey === "contact") {
      return saveSessionAndRedirect(req, res, res.locals.contactUsUrl);
    }

    if (req.body?.journey === "deleteAccount") {
      return saveSessionAndRedirect(req, res, res.locals.deleteAccountUrl);
    }

    await processAction(req, res, req.body.journey, pageId);
  } catch (error) {
    transformError(error, `error handling POST request on ${pageId}`);
    return next(error);
  }
}

const renderFeatureSetPage = async (req: Request, res: Response) => {
  return res.render(getTemplatePath("ipv", "page-featureset"), {
    featureSet: req.session.featureSet,
  });
}

export const checkFormRadioButtonSelected: RequestHandler = async (req, res, next) => {
  try {
    // If no radio option is selected re-display the form page with an error.
    if (req.body.journey === undefined) {
      await handleJourneyPageRequest(req, res, next, true);
    } else {
      return next();
    }
  } catch (error) {
    return next(error);
  }
}

export const formHandleUpdateDetailsCheckBox = async (req: Request, next: NextFunction) => {
  try {
    req.body.journey = getCoiUpdateDetailsJourney(req.body.detailsToUpdate);
    return next();
  } catch (error) {
    return next(error);
  }
}

export const formHandleCoiDetailsCheck: RequestHandler = async (req, res, next) => {
  try {
    const { context, currentPage } = req?.session || {};

    if (!currentPage) {
      throw new Error("currentPage cannot be empty")
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
        csrfToken: req.csrfToken(),
        context: context,
      };
      if (pageRequiresUserDetails(currentPage)) {
        renderOptions.userDetails = await fetchUserDetails(req);
      }
      return res.render(getIpvPageTemplatePath(currentPage), renderOptions);
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

export const validateFeatureSet = async (req: Request, next: NextFunction) => {
  try {
    const featureSet = req.query.featureSet as string;
    const isValidFeatureSet = /^\w{1,32}(,\w{1,32})*$/.test(featureSet);

    if (!isValidFeatureSet) {
      throw new Error("Invalid feature set ID");
    }

    req.session.featureSet = featureSet;

    return next();
  } catch (error) {
    return next(error);
  }
};

// You can use this handler to set req.params.pageId to mimic the `:pageId` path parameter used in the more generic handlers.
export const setRequestPageId = (pageId: string) => {
  return async (req: Request, next: NextFunction) => {
    req.params = req.params || {};
    req.params.pageId = pageId;
    return next();
  };
}

export {
  renderAttemptRecoveryPage,
  checkForIpvAndOauthSessionId,
};
