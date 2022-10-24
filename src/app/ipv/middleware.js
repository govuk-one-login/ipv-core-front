const axios = require("axios");
const { API_BASE_URL } = require("../../lib/config");
const {
  buildCredentialIssuerRedirectURL,
  redirectToAuthorize,
} = require("../shared/criHelper");
const logger = require("hmpo-logger").get();

const { generateAxiosConfig } = require("../shared/axiosHelper");
const { transformError } = require("../shared/loggerHelper");

async function journeyApi(action, req) {
  if (action.startsWith("/")) {
    action = action.substr(1);
  }

  logger.info("callring backend with action: :action", { req, action: action });
  return axios.post(
    `${API_BASE_URL}/${action}`,
    {},
    generateAxiosConfig(req.session.ipvSessionId)
  );
}

async function handleJourneyResponse(req, res, action) {
  const backendResponse = (await journeyApi(action, req)).data;
  return await handleBackendResponse(req, res, backendResponse);
}

async function handleBackendResponse(req, res, backendResponse) {
  if (backendResponse?.journey) {
    logger.info("journey response received", { req, res });
    return await handleJourneyResponse(req, res, backendResponse.journey);
  }

  if (backendResponse?.cri && tryValidateCriResponse(backendResponse.cri)) {
    logger.info("cri response received", { req, res });
    req.cri = backendResponse.cri;
    req.session.currentPage = req.cri.id;
    await buildCredentialIssuerRedirectURL(req, res);
    return redirectToAuthorize(req, res);
  }

  if (
    backendResponse?.client &&
    tryValidateClientResponse(backendResponse.client)
  ) {
    logger.info("client response received", { req, res });
    req.session.currentPage = "orchestrator";
    const { redirectUrl } = backendResponse.client;
    return res.redirect(redirectUrl);
  }

  if (backendResponse?.page) {
    logger.info("page response received", { req, res });
    req.session.currentPage = backendResponse.page;
    return res.redirect(`/ipv/page/${backendResponse.page}`);
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
  updateJourneyState: async (req, res, next) => {
    //routine to be removed once debug journey rewrite is complete
    try {
      if (!req.session.isDebugJourney) {
        return next(new Error("Debug operation not available"));
      }

      const action = req.url;
      //valid list of allowed actions for route
      const allowedActions = [
        /^\/journey\/(next|error|fail)$/,
        /^\/journey\/cri\/build-oauth-request\/(ukPassport|stubUkPassport|fraud|stubFraud|address|stubAddress|kbv|stubKbv|activityHistory|stubActivityHistory|dcmaw|stubDcmaw|debugAddress)$/,
        /^\/journey\/build-client-oauth-response$/,
        /^\/journey\/cri\/validate\/(ukPassport|stubUkPassport|fraud|stubFraud|address|stubAddress|kbv|stubKbv|dcmaw|stubDcmaw)$/,
      ];

      if (allowedActions.some((actionRegex) => actionRegex.test(action))) {
        await handleJourneyResponse(req, res, action);
      } else {
        next(new Error(`Action ${action} not valid`));
      }
    } catch (error) {
      next(error);
    }
  },
  handleJourneyPage: async (req, res, next) => {
    try {
      const { pageId } = req.params;
      if (req.session.currentPage !== pageId) {
        logger.error(
          "page :pageId doesn't match expected session page :expectedPage",
          {
            req,
            res,
            pageId: pageId,
            expectedPage: req.session.currentPage,
          }
        );

        req.session.currentPage = "pyi-technical-unrecoverable";
        return res.redirect(req.session.currentPage);
      }

      switch (pageId) {
        case "page-ipv-debug":
          return res.redirect("/debug");
        case "page-ipv-error":
        case "page-ipv-identity-start":
        case "page-ipv-success":
        case "page-pre-kbv-transition":
        case "page-dcmaw-success":
        case "page-passport-doc-check":
        case "pyi-kbv-fail":
        case "pyi-kbv-thin-file":
        case "pyi-no-match":
        case "pyi-technical":
        case "pyi-technical-unrecoverable":
          return res.render(`ipv/${pageId}`, {
            pageId,
            csrfToken: req.csrfToken(),
          });
        default:
          return res.render(`ipv/pyi-technical`);
      }
    } catch (error) {
      transformError(error, `error handling journey page: ${req.params}`);
      next(error);
    }
  },
  handleJourneyAction: async (req, res, next) => {
    try {
      if (req.body?.journey === "end") {
        await handleJourneyResponse(req, res, "journey/end");
      } else {
        await handleJourneyResponse(req, res, "journey/next");
      }
    } catch (error) {
      transformError(error, "error invoking handleJourneyAction");
      next(error);
    }
  },
  handleJourneyResponse,
  handleBackendResponse,
};
