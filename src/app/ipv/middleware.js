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
const UPDATE_DETAILS_JOURNEY_TYPES = require("../../constants/update-details-journeys");
const appDownloadHelper = require("../shared/appDownloadHelper");
const {
  getIpvPageTemplatePath,
  getIpvPagePath,
  getTemplatePath,
} = require("../../lib/paths");
const PAGES = require("../../constants/ipv-pages");
const { parseContextAsPhoneType } = require("../shared/contextHelper");
const {
  sniffPhoneType,
  getJourneyOnSniffing,
} = require("../shared/deviceSniffingHelper");

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

function checkForSessionId(req, res) {
  if (!req.session?.ipvSessionId) {
    const err = new Error("req.ipvSessionId is missing");
    err.status = HTTP_STATUS_CODES.UNAUTHORIZED;
    logError(req, err);

    req.session.currentPage = PAGES.PYI_TECHNICAL;
    res.status(HTTP_STATUS_CODES.UNAUTHORIZED);
    return res.render(getIpvPageTemplatePath(PAGES.PYI_TECHNICAL), {
      context: "unrecoverable",
    });
  }
}

function checkForIpvAndOauthSessionId(req, res) {
  if (!req.session?.ipvSessionId && !req.session?.clientOauthSessionId) {
    const err = new Error(
      "req.ipvSessionId and req.clientOauthSessionId is missing",
    );
    err.status = HTTP_STATUS_CODES.UNAUTHORIZED;
    logError(req, err);

    req.session.currentPage = PAGES.PYI_TECHNICAL;
    res.status(HTTP_STATUS_CODES.UNAUTHORIZED);
    return res.render(getIpvPageTemplatePath(PAGES.PYI_TECHNICAL), {
      context: "unrecoverable",
    });
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

  if (
    !detailsToUpdate ||
    (detailsToUpdate.includes("cancel") && detailsToUpdate.length > 1)
  ) {
    return;
  }

  if (detailsToUpdate.includes("cancel")) {
    return UPDATE_DETAILS_JOURNEY_TYPES.UPDATE_CANCEL;
  }
  // send to update-names-dob journey if dateOfBirth selected
  if (detailsToUpdate.includes("dateOfBirth")) {
    return UPDATE_DETAILS_JOURNEY_TYPES.UPDATE_NAMES_DOB;
  }

  const hasAddress = detailsToUpdate.includes("address");
  const hasGivenNames = detailsToUpdate.includes("givenNames");
  const hasFamilyName = detailsToUpdate.includes("familyName");

  // send to update-names-dob journey if both names selected
  if (hasGivenNames && hasFamilyName) {
    return UPDATE_DETAILS_JOURNEY_TYPES.UPDATE_NAMES_DOB;
  }

  if (hasGivenNames) {
    if (hasAddress) {
      return UPDATE_DETAILS_JOURNEY_TYPES.UPDATE_GIVEN_NAMES_ADDRESS;
    } else {
      return UPDATE_DETAILS_JOURNEY_TYPES.UPDATE_GIVEN_NAMES;
    }
  }

  if (hasFamilyName) {
    if (hasAddress) {
      return UPDATE_DETAILS_JOURNEY_TYPES.UPDATE_FAMILY_NAME_ADDRESS;
    } else {
      return UPDATE_DETAILS_JOURNEY_TYPES.UPDATE_FAMILY_NAME;
    }
  }

  // send to address journey if just the address
  if (hasAddress) {
    return UPDATE_DETAILS_JOURNEY_TYPES.UPDATE_ADDRESS;
  }
}

function pageRequiresUserDetails(pageId) {
  return [
    PAGES.PAGE_IPV_REUSE,
    PAGES.CONFIRM_NAME_DATE_BIRTH,
    PAGES.CONFIRM_ADDRESS,
    PAGES.UPDATE_DETAILS,
  ].includes(pageId);
}

function isValidPage(pageId) {
  return allTemplates.includes(pageId);
}

function handleAppStoreRedirect(req, res, next) {
  const specifiedPhoneType = sniffPhoneType(req, req.params.specifiedPhoneType);

  try {
    switch (specifiedPhoneType) {
      case PHONE_TYPES.IPHONE:
        res.redirect(APP_STORE_URL_APPLE);
        break;
      case PHONE_TYPES.ANDROID:
        res.redirect(APP_STORE_URL_ANDROID);
        break;
      default:
        throw new Error("Unrecognised phone type: " + specifiedPhoneType);
    }
  } catch (error) {
    transformError(error, "Error redirecting to app store");
    next(error);
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

module.exports = {
  renderAttemptRecoveryPage: async (req, res) => {
    res.render(getIpvPageTemplatePath(PAGES.PYI_ATTEMPT_RECOVERY), {
      csrfToken: req.csrfToken(),
    });
  },
  updateJourneyState: async (req, res, next) => {
    try {
      const currentPageId = req.params.pageId;
      const { action } = req.params;

      if (action && isValidPage(currentPageId)) {
        await handleJourneyResponse(req, res, action, currentPageId);
      } else {
        res.status(HTTP_STATUS_CODES.NOT_FOUND);
        return res.render(getTemplatePath("errors", "page-not-found"));
      }
    } catch (error) {
      next(error);
    }
  },
  handleJourneyPage: async (req, res, next) => {
    try {
      const { pageId } = req.params;
      const { context } = req?.session || "";

      // handles page id validation first
      if (!isValidPage(pageId)) {
        res.status(HTTP_STATUS_CODES.NOT_FOUND);
        return res.render(getTemplatePath("errors", "page-not-found"));
      }

      if (req.session?.ipvSessionId === null) {
        logError(
          req,
          {
            pageId: pageId,
            expectedPage: req.session.currentPage,
          },
          "req.ipvSessionId is null",
        );

        req.session.currentPage = PAGES.PYI_TECHNICAL;
        return res.render(getIpvPageTemplatePath(req.session.currentPage), {
          context: "unrecoverable",
        });
      } else if (pageId === PAGES.PYI_TIMEOUT_UNRECOVERABLE) {
        req.session.currentPage = PAGES.PYI_TIMEOUT_UNRECOVERABLE;
        return res.render(getIpvPageTemplatePath(req.session.currentPage));
      } else if (req.session.currentPage !== pageId) {
        return await handleUnexpectedPage(req, res, pageId);
      }

      const renderOptions = {
        pageId,
        csrfToken: req.csrfToken(),
        context,
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
      } else if (req.query?.errorState !== undefined) {
        renderOptions.pageErrorState = req.query.errorState;
      } else if (req.session.currentPageStatusCode !== undefined) {
        res.status(req.session.currentPageStatusCode);
      }

      return res.render(
        getIpvPageTemplatePath(sanitize(pageId)),
        renderOptions,
      );
    } catch (error) {
      transformError(error, `error handling journey page: ${req.params}`);
      next(error);
    } finally {
      delete req.session.currentPageStatusCode;
    }
  },

  handleJourneyAction: async (req, res, next) => {
    const currentPageId = req.params.pageId;
    const pagesUsingSessionId = [
      PAGES.NO_PHOTO_ID_EXIT_FIND_ANOTHER_WAY,
      PAGES.NO_PHOTO_ID_SECURITY_QUESTIONS_FIND_ANOTHER_WAY,
      PAGES.PAGE_MULTIPLE_DOC_CHECK,
      PAGES.PYI_CRI_ESCAPE,
      PAGES.PYI_SUGGEST_OTHER_OPTIONS,
    ];

    try {
      if (pagesUsingSessionId.includes(currentPageId)) {
        checkForSessionId(req, res);
      } else {
        checkForIpvAndOauthSessionId(req, res);
      }
      checkJourneyAction(req);
      if (req.body?.journey === "contact") {
        return await saveSessionAndRedirect(req, res, res.locals.contactUsUrl);
      }

      await handleJourneyResponse(req, res, req.body.journey, currentPageId);
    } catch (error) {
      transformError(error, `error handling POST request on ${currentPageId}`);
      next(error);
    }
  },

  renderFeatureSetPage: async (req, res) => {
    res.render(getTemplatePath("ipv", "page-featureset"), {
      featureSet: req.session.featureSet,
    });
  },
  formRadioButtonChecked: async (req, res, next) => {
    try {
      const { context } = req?.session || "";
      const pageId = req.session.currentPage;

      const expectedPageId = req.params?.pageId;

      if (expectedPageId && expectedPageId !== pageId) {
        return await handleUnexpectedPage(req, res, expectedPageId);
      }

      if (req.method === "POST" && req.body.journey === undefined) {
        const renderOptions = {
          pageId,
          csrfToken: req.csrfToken(),
          pageErrorState: true,
          context,
        };

        if (pageRequiresUserDetails(pageId)) {
          renderOptions.userDetails = await fetchUserDetails(req);
        }

        req.renderOptions = renderOptions;

        res.render(getIpvPageTemplatePath(sanitize(pageId)), renderOptions);
      } else {
        if (req.body?.journey === "appTriage") {
          req.body.journey = getJourneyOnSniffing(req);
        }
        next();
      }
    } catch (error) {
      next(error);
    }
  },
  formHandleUpdateDetailsCheckBox: async (req, res, next) => {
    try {
      req.body.journey = getCoiUpdateDetailsJourney(req.body.detailsToUpdate);
      next();
    } catch (error) {
      next(error);
    }
  },
  validateFeatureSet: async (req, res, next) => {
    try {
      const featureSet = req.query.featureSet;
      const isValidFeatureSet = /^\w{1,32}(,\w{1,32})*$/.test(featureSet);
      if (!isValidFeatureSet) {
        throw new Error("Invalid feature set ID");
      }
      req.session.featureSet = featureSet;
      next();
    } catch (error) {
      return next(error);
    }
  },
  handleJourneyResponse,
  handleBackendResponse,
  pageRequiresUserDetails,
  handleAppStoreRedirect,
  checkForIpvAndOauthSessionId,
};
