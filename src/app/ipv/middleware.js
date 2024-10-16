const sanitize = require("sanitize-filename");

const { APP_STORE_URL_ANDROID, APP_STORE_URL_APPLE } =
  require("../../lib/config").default;
const {
  buildCredentialIssuerRedirectURL,
  redirectToAuthorize,
} = require("../shared/criHelper");
const { logError, transformError } = require("../shared/loggerHelper");
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
const {
  sniffPhoneType,
  detectAppTriageEvent,
} = require("../shared/deviceSniffingHelper");
const ERROR_PAGES = require("../../constants/error-pages");

const directoryPath = path.resolve("views/ipv/page");

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

  return coreBackService.postJourneyEvent(req, action, currentPageId);
}

async function fetchUserDetails(req) {
  const userDetailsResponse =
    await coreBackService.getProvenIdentityUserDetails(req);

  return generateUserDetails(userDetailsResponse, req.i18n);
}

async function processAction(req, res, action, currentPageId = "") {
  const backendResponse = (await journeyApi(action, req, currentPageId)).data;

  return await handleBackendResponse(req, res, backendResponse);
}

async function handleBackendResponse(req, res, backendResponse) {
  if (backendResponse?.journey) {
    return await processAction(req, res, backendResponse.journey);
  }

  if (backendResponse?.cri && tryValidateCriResponse(backendResponse.cri)) {
    req.cri = backendResponse.cri;
    req.session.currentPage = req.cri.id;
    await buildCredentialIssuerRedirectURL(req, res);
    return redirectToAuthorize(req, res);
  }

  if (
    backendResponse?.client &&
    tryValidateClientResponse(backendResponse.client)
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

  if (backendResponse?.page) {
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
        return saveSessionAndRedirect(req, res, APP_STORE_URL_APPLE);
      case PHONE_TYPES.ANDROID:
        return saveSessionAndRedirect(req, res, APP_STORE_URL_ANDROID);
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

  return saveSessionAndRedirect(
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
    csrfToken: req.csrfToken(true),
  });
}

function staticPageMiddleware(pageId) {
  return function (req, res) {
    return res.render(getIpvPageTemplatePath(pageId));
  };
}

async function validateSessionAndPage(req, res, pageId) {
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

async function updateJourneyState(req, res, next) {
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

async function handleJourneyPageRequest(
  req,
  res,
  next,
  pageErrorState = undefined,
) {
  try {
    const { pageId } = req.params;
    const { context } = req?.session || "";

    // Stop further processing if response has already been handled
    if (!(await validateSessionAndPage(req, res, pageId))) {
      return;
    }

    const renderOptions = {
      pageId,
      csrfToken: req.csrfToken(true),
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

async function handleJourneyActionRequest(req, res, next) {
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

async function renderFeatureSetPage(req, res) {
  return res.render(getTemplatePath("ipv", "page-featureset"), {
    featureSet: req.session.featureSet,
  });
}

async function checkFormRadioButtonSelected(req, res, next) {
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
        csrfToken: req.csrfToken(true),
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
  handleJourneyPageRequest,
  handleJourneyActionRequest,
  renderFeatureSetPage,
  staticPageMiddleware,
  checkFormRadioButtonSelected,
  formHandleUpdateDetailsCheckBox,
  formHandleCoiDetailsCheck,
  validateFeatureSet,
  processAction,
  handleBackendResponse,
  pageRequiresUserDetails,
  handleAppStoreRedirect,
  checkForIpvAndOauthSessionId,
  setRequestPageId,
};
