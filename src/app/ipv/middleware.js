const sanitize = require("sanitize-filename");

const {
  APP_STORE_URL_ANDROID,
  APP_STORE_URL_APPLE,
} = require("../../lib/config");
const {
  buildCredentialIssuerRedirectURL,
  redirectToAuthorize,
} = require("../shared/criHelper");
const {
  logError,
  logCoreBackCall,
  transformError,
} = require("../shared/loggerHelper");
const {
  LOG_COMMUNICATION_TYPE_REQUEST,
  LOG_TYPE_JOURNEY,
  LOG_COMMUNICATION_TYPE_RESPONSE,
  LOG_TYPE_CRI,
  LOG_TYPE_CLIENT,
  LOG_TYPE_PAGE,
} = require("../shared/loggerConstants");
const { generateUserDetails } = require("../shared/reuseHelper");
const { HTTP_STATUS_CODES } = require("../../app.constants");
const fs = require("fs");
const path = require("path");
const { saveSessionAndRedirect } = require("../shared/redirectHelper");
const coreBackService = require("../../services/coreBackService");
const qrCodeHelper = require("../shared/qrCodeHelper");
const PHONE_TYPES = require("../../constants/phone-types");
const {
  SUPPORTED_COMBO_EVENTS,
  UNSUPPORTED_COMBO_EVENTS,
} = require("../../constants/update-details-journeys");
const appDownloadHelper = require("../shared/appDownloadHelper");
const {
  getIpvPageTemplatePath,
  getIpvPagePath,
  getTemplatePath,
  getErrorPageTemplatePath,
} = require("../../lib/paths");
const PAGES = require("../../constants/ipv-pages");
const { parseContextAsPhoneType } = require("../shared/contextHelper");
const { sniffPhoneType } = require("../shared/deviceSniffingHelper");
const ERROR_PAGES = require("../../constants/error-pages");

const directoryPath = path.join(__dirname, "/../../views/ipv/page");

const allTemplates = fs
  .readdirSync(directoryPath)
  .map((file) => path.parse(file).name);

async function journeyApi(action, req, currentPageId) {
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

  return coreBackService.postJourneyEvent(req, action, currentPageId);
}

async function fetchUserDetails(req) {
  const userDetailsResponse =
    await coreBackService.getProvenIdentityUserDetails(req);

  return generateUserDetails(userDetailsResponse, req.i18n);
}

async function handleJourneyResponse(req, res, action, currentPageId = "") {
  const backendResponse = (await journeyApi(action, req, currentPageId)).data;

  return await handleBackendResponse(req, res, backendResponse);
}

async function handleBackendResponse(req, res, backendResponse) {
  if (backendResponse?.journey) {
    logCoreBackCall(req, {
      logCommunicationType: LOG_COMMUNICATION_TYPE_RESPONSE,
      type: LOG_TYPE_JOURNEY,
      path: backendResponse.journey,
    });
    return await handleJourneyResponse(req, res, backendResponse.journey);
  }

  if (backendResponse?.cri && tryValidateCriResponse(backendResponse.cri)) {
    logCoreBackCall(req, {
      logCommunicationType: LOG_COMMUNICATION_TYPE_RESPONSE,
      type: LOG_TYPE_CRI,
      path: req.cri,
    });
    req.cri = backendResponse.cri;
    req.session.currentPage = req.cri.id;
    await buildCredentialIssuerRedirectURL(req, res);
    return redirectToAuthorize(req, res);
  }

  if (
    backendResponse?.client &&
    tryValidateClientResponse(backendResponse.client)
  ) {
    logCoreBackCall(req, {
      logCommunicationType: LOG_COMMUNICATION_TYPE_RESPONSE,
      type: LOG_TYPE_CLIENT,
      path: backendResponse.client,
    });

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
    return res.redirect(redirectUrl);
  }

  if (backendResponse?.page) {
    logCoreBackCall(req, {
      logCommunicationType: LOG_COMMUNICATION_TYPE_RESPONSE,
      type: LOG_TYPE_PAGE,
      path: backendResponse.page,
      requestId: req.requestId,
      context: backendResponse?.context,
    });

    req.session.currentPage = backendResponse.page;
    req.session.context = backendResponse?.context;
    req.session.currentPageStatusCode = backendResponse?.statusCode;

    return await saveSessionAndRedirect(
      req,
      res,
      getIpvPagePath(req.session.currentPage),
    );
  }
  const message = {
    description: "Unexpected backend response",
    data: backendResponse,
  };
  req.log.error({ message, level: "ERROR" });
  throw new Error(message.description);
}

function tryValidateCriResponse(criResponse) {
  if (!criResponse?.redirectUrl) {
    throw new Error("CRI response RedirectUrl is missing");
  }

  return true;
}

function tryValidateClientResponse(client) {
  const { redirectUrl } = client;

  if (!redirectUrl) {
    throw new Error("Client Response redirect url is missing");
  }

  return true;
}

function checkForIpvAndOauthSessionId(req, res) {
  if (!req.session?.ipvSessionId && !req.session?.clientOauthSessionId) {
    const err = new Error(
      "req.ipvSessionId and req.clientOauthSessionId are both missing",
    );
    err.status = HTTP_STATUS_CODES.UNAUTHORIZED;
    logError(req, err);

    return renderTechnicalError(req, res);
  }
}

function checkJourneyAction(req) {
  if (!req.body?.journey) {
    const err = new Error("req.body?.journey is missing");
    err.status = HTTP_STATUS_CODES.BAD_REQUEST;
    logError(req, err);

    throw new Error("req.body?.journey is missing");
  }
}

// getCoiUpdateDetailsJourney determines the next journey based on the detailsToUpdate
// field of the update-details page
function getCoiUpdateDetailsJourney(detailsToUpdate) {
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
      .map((details) => UNSUPPORTED_COMBO_EVENTS[details])
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

function isInvalidDetailsToUpdate(detailsToUpdate) {
  return (
    !detailsToUpdate ||
    (detailsToUpdate.includes("cancel") && detailsToUpdate.length > 1)
  );
}

function pageRequiresUserDetails(pageId) {
  return [
    PAGES.PAGE_IPV_REUSE,
    PAGES.CONFIRM_NAME_DATE_BIRTH,
    PAGES.CONFIRM_ADDRESS,
    PAGES.CONFIRM_DETAILS,
    PAGES.UPDATE_DETAILS,
  ].includes(pageId);
}

function isValidIpvPage(pageId) {
  return allTemplates.includes(pageId);
}

function handleAppStoreRedirect(req, res, next) {
  const specifiedPhoneType = sniffPhoneType(req, req.params.specifiedPhoneType);

  try {
    switch (specifiedPhoneType) {
      case PHONE_TYPES.IPHONE:
        return res.redirect(APP_STORE_URL_APPLE);
      case PHONE_TYPES.ANDROID:
        return res.redirect(APP_STORE_URL_ANDROID);
      default:
        throw new Error("Unrecognised phone type: " + specifiedPhoneType);
    }
  } catch (error) {
    transformError(error, "Error redirecting to app store");
    return next(error);
  }
}

async function handleUnexpectedPage(req, res, pageId) {
  logError(
    req,
    {
      pageId: pageId,
      expectedPage: req.session.currentPage,
    },
    "page :pageId doesn't match expected session page :expectedPage",
  );

  req.session.currentPage = PAGES.PYI_ATTEMPT_RECOVERY;

  return await saveSessionAndRedirect(
    req,
    res,
    getIpvPagePath(PAGES.PYI_ATTEMPT_RECOVERY),
  );
}

function render404(response) {
  response.status(HTTP_STATUS_CODES.NOT_FOUND);
  return response.render(getErrorPageTemplatePath(ERROR_PAGES.PAGE_NOT_FOUND));
}

function renderTechnicalError(request, response) {
  request.session.currentPage = PAGES.PYI_TECHNICAL;
  response.status(HTTP_STATUS_CODES.UNAUTHORIZED);
  return response.render(getIpvPageTemplatePath(PAGES.PYI_TECHNICAL), {
    context: "unrecoverable",
  });
}

async function renderAttemptRecoveryPage(req, res) {
  return res.render(getIpvPageTemplatePath(PAGES.PYI_ATTEMPT_RECOVERY), {
    csrfToken: req.csrfToken(),
  });
}

async function validateSessionAndPage(req, res, pageId) {
  // Check if the page is valid
  if (!isValidIpvPage(pageId)) {
    res.status(HTTP_STATUS_CODES.NOT_FOUND);
    return res.render(getTemplatePath("errors", "page-not-found"));
  }

  // Check for clientOauthSessionId for recoverable timeout page
  if (
    req.session?.clientOauthSessionId &&
    pageId === PAGES.PYI_TIMEOUT_RECOVERABLE
  ) {
    req.session.currentPage = PAGES.PYI_TIMEOUT_RECOVERABLE;
    return res.render(getIpvPageTemplatePath(req.session.currentPage));
  }

  // Check if ipvSessionId is present
  if (!req.session?.ipvSessionId) {
    logError(
      req,
      {
        pageId: pageId,
        expectedPage: req.session?.currentPage,
      },
      "req.ipvSessionId is null",
    );

    return renderTechnicalError(req, res);
  }

  // Handle the unrecoverable timeout page
  if (pageId === PAGES.PYI_TIMEOUT_UNRECOVERABLE) {
    req.session.currentPage = PAGES.PYI_TIMEOUT_UNRECOVERABLE;
    return res.render(getIpvPageTemplatePath(req.session.currentPage));
  }

  if (req.session.currentPage !== pageId) {
    await handleUnexpectedPage(req, res, pageId);
    return false;
  }

  // Return true if validation passed
  return true;
}

async function updateJourneyState(req, res, next) {
  try {
    const currentPageId = req.params.pageId;
    const action = req.params.action;

    if (action && isValidIpvPage(currentPageId)) {
      await handleJourneyResponse(req, res, action, currentPageId);
    } else {
      return render404(res);
    }
  } catch (error) {
    return next(error);
  }
}

async function handleJourneyPage(req, res, next, pageErrorState = undefined) {
  try {
    const { pageId } = req.params;
    const { context } = req?.session || "";

    // handles page id validation first
    if (!(await validateSessionAndPage(req, res, pageId))) {
      return;
    }

    const renderOptions = {
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
      res.status(req.session.currentPageStatusCode);
    }

    return res.render(getIpvPageTemplatePath(sanitize(pageId)), renderOptions);
  } catch (error) {
    transformError(error, `error handling journey page: ${req.params}`);
    return next(error);
  } finally {
    delete req.session.currentPageStatusCode;
  }
}

async function handleJourneyAction(req, res, next) {
  const pageId = req.params.pageId;

  try {
    if (!(await validateSessionAndPage(req, res, pageId))) {
      return;
    }

    checkJourneyAction(req);
    if (req.body?.journey === "contact") {
      return await saveSessionAndRedirect(req, res, res.locals.contactUsUrl);
    }

    if (req.body?.journey === "deleteAccount") {
      return await saveSessionAndRedirect(
        req,
        res,
        res.locals.deleteAccountUrl,
      );
    }

    await handleJourneyResponse(req, res, req.body.journey, pageId);
  } catch (error) {
    transformError(error, `error handling POST request on ${pageId}`);
    return next(error);
  }
}

async function renderFeatureSetPage(req, res) {
  return res.render(getTemplatePath("ipv", "page-featureset"), {
    featureSet: req.session.featureSet,
  });
}

async function checkFormRadioButtonSelected(req, res, next) {
  try {
    // If no radio option is selected re-display the form page with an error.
    if (req.body.journey === undefined) {
      await handleJourneyPage(req, res, next, true);
    } else {
      return next();
    }
  } catch (error) {
    return next(error);
  }
}

async function formHandleUpdateDetailsCheckBox(req, res, next) {
  try {
    req.body.journey = getCoiUpdateDetailsJourney(req.body.detailsToUpdate);
    return next();
  } catch (error) {
    return next(error);
  }
}

async function formHandleCoiDetailsCheck(req, res, next) {
  try {
    const { context, currentPage } = req?.session || {};
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
      const renderOptions = {
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

async function validateFeatureSet(req, res, next) {
  try {
    const featureSet = req.query.featureSet;
    const isValidFeatureSet = /^\w{1,32}(,\w{1,32})*$/.test(featureSet);
    if (!isValidFeatureSet) {
      throw new Error("Invalid feature set ID");
    }
    req.session.featureSet = featureSet;
    return next();
  } catch (error) {
    return next(error);
  }
}

// You can use this handler to set req.params.pageId to mimic the `:pageId` path parameter used in the more generic handlers.
function setRequestPageId(pageId) {
  return async (req, res, next) => {
    req.params = req.params || {};
    req.params.pageId = pageId;
    return next();
  };
}

module.exports = {
  renderAttemptRecoveryPage,
  updateJourneyState,
  handleJourneyPage,
  handleJourneyAction,
  renderFeatureSetPage,
  checkFormRadioButtonSelected,
  formHandleUpdateDetailsCheckBox,
  formHandleCoiDetailsCheck,
  validateFeatureSet,
  handleJourneyResponse,
  handleBackendResponse,
  pageRequiresUserDetails,
  handleAppStoreRedirect,
  checkForIpvAndOauthSessionId,
  setRequestPageId,
};
