const sanitize = require("sanitize-filename");

const { ENABLE_PREVIEW } = require("../../lib/config");
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
const { getIpAddress } = require("../shared/ipAddressHelper");
const fs = require("fs");
const path = require("path");
const { saveSessionAndRedirect } = require("../shared/redirectHelper");
const coreBackService = require("../../services/coreBackService");

async function journeyApi(action, req) {
  if (action.startsWith("/")) {
    action = action.substr(1);
  }

  logCoreBackCall(req, {
    logCommunicationType: LOG_COMMUNICATION_TYPE_REQUEST,
    type: LOG_TYPE_JOURNEY,
    path: action,
  });

  return coreBackService.postAction(req, action);
}

async function handleJourneyResponse(req, res, action) {
  const backendResponse = (await journeyApi(action, req)).data;
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

    return await saveSessionAndRedirect(
      req,
      res,
      `/ipv/page/${backendResponse.page}`,
    );
  }
}

function tryValidateCriResponse(criResponse) {
  if (!criResponse?.redirectUrl) {
    throw new Error(`CRI response RedirectUrl is missing`);
  }

  return true;
}

function tryValidateClientResponse(client) {
  const { redirectUrl } = client;

  if (!redirectUrl) {
    throw new Error(`Client Response redirect url is missing`);
  }

  return true;
}

module.exports = {
  renderAttemptRecoveryPage: async (req, res) => {
    res.render("ipv/pyi-attempt-recovery.njk", {
      csrfToken: req.csrfToken(),
    });
  },
  updateJourneyState: async (req, res, next) => {
    try {
      const allowedActions = [
        "/journey/next",
        "/journey/end",
        "/journey/error",
        "/journey/fail",
        "/journey/attempt-recovery",
        "/journey/cri/build-oauth-request/ukPassport",
        "/journey/cri/build-oauth-request/stubUkPassport",
        "/journey/cri/build-oauth-request/fraud",
        "/journey/cri/build-oauth-request/stubFraud",
        "/journey/cri/build-oauth-request/address",
        "/journey/cri/build-oauth-request/stubAddress",
        "/journey/cri/build-oauth-request/kbv",
        "/journey/cri/build-oauth-request/stubKbv",
        "/journey/cri/build-oauth-request/activityHistory",
        "/journey/cri/build-oauth-request/stubActivityHistory",
        "/journey/cri/build-oauth-request/dcmaw",
        "/journey/cri/build-oauth-request/stubDcmaw",
        "/journey/build-client-oauth-response",
        "/journey/cri/validate/ukPassport",
        "/journey/cri/validate/stubUkPassport",
        "/journey/cri/validate/fraud",
        "/journey/cri/validate/stubFraud",
        "/journey/cri/validate/address",
        "/journey/cri/validate/stubAddress",
        "/journey/cri/validate/kbv",
        "/journey/cri/validate/stubKbv",
        "/journey/cri/validate/dcmaw",
        "/journey/cri/validate/stubDcmaw",
        "/user/proven-identity-details",
      ];

      const action = allowedActions.find((x) => x === req.url);

      if (action) {
        await handleJourneyResponse(req, res, action);
      } else {
        next(new Error(`Action ${req.url} not valid`));
      }
    } catch (error) {
      next(error);
    }
  },
  handleJourneyPage: async (req, res, next) => {
    try {
      let { pageId } = req.params;
      const { context } = req?.session || "";

      // Remove this as part of PYIC-4278
      if (ENABLE_PREVIEW && req.query.preview) {
        return res.redirect("/ipv/all-templates");
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

        req.session.currentPage = "pyi-technical";
        return res.render(`ipv/${req.session.currentPage}.njk`, {context: "unrecoverable"});
      } else if (pageId === "pyi-timeout-unrecoverable") {
        req.session.currentPage = "pyi-timeout-unrecoverable";
        return res.render(`ipv/${req.session.currentPage}.njk`);
      } else if (req.session.currentPage !== pageId) {
        logError(
          req,
          {
            pageId: pageId,
            expectedPage: req.session.currentPage,
          },
          "page :pageId doesn't match expected session page :expectedPage",
        );

        req.session.currentPage = "pyi-attempt-recovery";
        return await saveSessionAndRedirect(
          req,
          res,
          `/ipv/page/pyi-attempt-recovery`,
        );
      }

      switch (pageId) {
        case "pyi-new-details":
        case "pyi-confirm-delete-details":
        case "pyi-details-deleted":
        case "pyi-f2f-delete-details":
        case "page-ipv-identity-document-start":
        case "page-ipv-identity-postoffice-start":
        case "page-ipv-bank-account-start":
        case "page-ipv-success":
        case "page-face-to-face-handoff":
        case "page-ipv-pending":
        case "page-pre-kbv-transition":
        case "page-dcmaw-success":
        case "page-multiple-doc-check":
        case "page-f2f-multiple-doc-check":
        case "pyi-attempt-recovery":
        case "pyi-kbv-fail":
        case "pyi-kbv-thin-file":
        case "pyi-no-match":
        case "pyi-escape":
        case "pyi-cri-escape":
        case "pyi-cri-escape-no-f2f":
        case "pyi-suggest-other-options":
        case "pyi-suggest-other-options-no-f2f":
        case "pyi-suggest-f2f":
        case "pyi-post-office":
        case "pyi-another-way":
        case "pyi-timeout-recoverable":
        case "pyi-timeout-unrecoverable":
        case "pyi-f2f-technical":
        case "pyi-technical":
        case "pyi-technical-unrecoverable": {
          const renderOptions = {
            pageId,
            csrfToken: req.csrfToken(),
            context,
          };

          if (pageId === "pyi-technical-unrecoverable") {
            pageId = "pyi-technical"
            renderOptions.context = "unrecoverable"
          }

          if (req.query?.errorState !== undefined) {
            renderOptions.pageErrorState = req.query.errorState;
          }

          return res.render(`ipv/${sanitize(pageId)}.njk`, renderOptions);
        }
        case "page-ipv-reuse": {
          const userDetailsResponse =
            await coreBackService.getProvenIdentityUserDetails(req);
          const userDetails = generateUserDetails(
            userDetailsResponse,
            req.i18n,
          );

          return res.render(`ipv/${sanitize(pageId)}.njk`, {
            userDetails,
            pageId,
            csrfToken: req.csrfToken(),
            context,
          });
        }
        default:
          return res.render(`ipv/pyi-technical.njk`);
      }
    } catch (error) {
      transformError(error, `error handling journey page: ${req.params}`);
      next(error);
    }
  },
  handleJourneyAction: async (req, res, next) => {
    try {
      if (!req.session?.ipvSessionId && !req.session?.clientOauthSessionId) {
        const err = new Error(
          "req.ipvSessionId and req.clientOauthSessionId is missing",
        );
        err.status = HTTP_STATUS_CODES.UNAUTHORIZED;
        logError(req, err);

        req.session.currentPage = "pyi-technical";
        res.status(HTTP_STATUS_CODES.UNAUTHORIZED);
        return res.render("ipv/pyi-technical.njk", {context: "unrecoverable"});
      }
      if (req.body?.journey === "end") {
        await handleJourneyResponse(req, res, "journey/end");
      } else if (req.body?.journey === "attempt-recovery") {
        await handleJourneyResponse(req, res, "journey/attempt-recovery");
      } else if (req.body?.journey === "build-client-oauth-response") {
        req.session.ipAddress = req?.session?.ipAddress
          ? req.session.ipAddress
          : getIpAddress(req);
        await handleJourneyResponse(
          req,
          res,
          "journey/build-client-oauth-response",
        );
      } else {
        await handleJourneyResponse(req, res, "journey/next");
      }
    } catch (error) {
      transformError(error, "error invoking handleJourneyAction");
      next(error);
    }
  },
  handleMultipleDocCheck: async (req, res, next) => {
    try {
      if (!req.session?.ipvSessionId) {
        const err = new Error("req.ipvSessionId is missing");
        err.status = HTTP_STATUS_CODES.UNAUTHORIZED;
        logError(req, err);

        req.session.currentPage = "pyi-technical";
        res.status(HTTP_STATUS_CODES.UNAUTHORIZED);
        return res.render("ipv/pyi-technical.njk", {context: "unrecoverable"});
      }
      if (req.body?.journey === "next/passport") {
        await handleJourneyResponse(req, res, "journey/ukPassport");
      } else if (req.body?.journey === "next/driving-licence") {
        await handleJourneyResponse(req, res, "journey/drivingLicence");
      } else {
        await handleJourneyResponse(req, res, "journey/end");
      }
    } catch (error) {
      transformError(error, "error invoking handleMultipleDocCheck");
      next(error);
    }
  },
  handleCriEscapeAction: async (req, res, next) => {
    try {
      if (!req.session?.ipvSessionId) {
        const err = new Error("req.ipvSessionId is missing");
        err.status = HTTP_STATUS_CODES.UNAUTHORIZED;
        logError(req, err);

        req.session.currentPage = "pyi-technical";
        res.status(HTTP_STATUS_CODES.UNAUTHORIZED);
        return res.render("ipv/pyi-technical.njk", {context: "unrecoverable"});
      }
      if (req.body?.journey === "next/f2f") {
        await handleJourneyResponse(req, res, "journey/f2f");
      } else if (req.body?.journey === "next/dcmaw") {
        await handleJourneyResponse(req, res, "journey/dcmaw");
      } else {
        await handleJourneyResponse(req, res, "journey/end");
      }
    } catch (error) {
      transformError(error, "error invoking handleCriEscapeAction");
      next(error);
    }
  },
  handleCimitEscapeAction: async (req, res, next) => {
    try {
      if (!req.session?.ipvSessionId) {
        const err = new Error("req.ipvSessionId is missing");
        err.status = HTTP_STATUS_CODES.UNAUTHORIZED;
        logError(req, err);

        req.session.currentPage = "pyi-technical";
        res.status(HTTP_STATUS_CODES.UNAUTHORIZED);
        return res.render("ipv/pyi-technical.njk", {context: "unrecoverable"});
      }
      if (req.body?.journey === "next/f2f") {
        await handleJourneyResponse(req, res, "journey/f2f");
      } else if (req.body?.journey === "next/dcmaw") {
        await handleJourneyResponse(req, res, "journey/dcmaw");
      } else {
        await handleJourneyResponse(req, res, "journey/end");
      }
    } catch (error) {
      transformError(error, "error invoking handleCimitEscapeAction");
      next(error);
    }
  },
  renderFeatureSetPage: async (req, res) => {
    res.render("ipv/page-featureset.njk", {
      featureSet: req.session.featureSet,
    });
  },
  allTemplates: async (req, res, next) => {
    try {
      const directoryPath = __dirname + "/../../views/ipv";

      fs.readdir(directoryPath, function (err, files) {
        if (err) {
          return next(err);
        }

        // Remove the .njk extension from file names
        const templatesWithoutExtension = files.map(
          (file) => path.parse(file).name,
        );

        res.render("ipv/all-templates.njk", {
          allTemplates: templatesWithoutExtension,
        });
      });
    } catch (error) {
      next(error);
    }
  },
  formRadioButtonChecked: async (req, res, next) => {
    try {
      if (req.method === "POST" && req.body.journey === undefined) {
        res.render(`ipv/${sanitize(req.session.currentPage)}.njk`, {
          pageId: req.session.currentPage,
          csrfToken: req.csrfToken(),
          pageErrorState: true,
        });
      } else {
        next();
      }
    } catch (error) {
      next(error);
    }
  },
  validateFeatureSet: async (req, res, next) => {
    try {
      const featureSet = req.query.featureSet;
      const isValidFeatureSet = /^\w{1,32}$/.test(featureSet);
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
};
