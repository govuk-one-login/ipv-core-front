const axios = require("axios");
const { API_BASE_URL } = require("../../lib/config");
const {
  buildCredentialIssuerRedirectURL,
  redirectToAuthorize,
} = require("../shared/criHelper");
const logger = require("hmpo-logger").get();

const { generateAxiosConfig } = require("../shared/axiosHelper");

async function journeyApi(action, req) {
  if (action.startsWith("/")) {
    action = action.substr(1);
  }

  logger.info("calling backend with action: :action", { req, action: action });
  return axios.post(
    `${API_BASE_URL}/${action}`,
    {},
    generateAxiosConfig(req.session.ipvSessionId)
  );
}

async function handleJourneyResponse(req, res, action) {
  const response = (await journeyApi(action, req)).data;

  if (response?.journey) {
    logger.info("journey response received", { req, res });
    await handleJourneyResponse(req, res, response.journey);
  }

  if (response?.cri && tryValidateCriResponse(response.cri)) {
    logger.info("cri response received", { req, res });
    req.cri = response.cri;
    req.session.currentPage = req.cri.id;
    await buildCredentialIssuerRedirectURL(req, res);
    return redirectToAuthorize(req, res);
  }

  if (response?.client && tryValidateClientResponse(response.client)) {
    logger.info("client response received", { req, res });
    req.session.currentPage = "orchestrator";
    const { redirectUrl } = response.client;
    return res.redirect(redirectUrl);
  }

  if (response?.page) {
    logger.info("page response received", { req, res });
    req.session.currentPage = response.page;
    return res.redirect(`/ipv/page/${response.page}`);
  }
}

function tryValidateCriResponse(criResponse) {
  if (!criResponse?.authorizeUrl) {
    throw new Error(`CRI response AuthorizeUrl is missing`);
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
    try {
      const action = req.url;
      //valid list of allowed actions for route
      const allowedActions = [
        /^\/journey\/(next|error|fail)$/,
        /^\/journey\/cri\/build-oauth-request\/(ukPassport|stubUkPassport|fraud|stubFraud|address|stubAddress|kbv|stubKbv|activityHistory|stubActivityHistory|debugAddress)$/,
        /^\/journey\/build-client-oauth-response$/,
        /^\/journey\/cri\/validate\/(ukPassport|stubUkPassport|fraud|stubFraud|address|stubAddress|kbv|stubKbv)$/,
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
        case "pyi-kbv-fail":
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
      logger.error("error handling journey page: :pageId", {
        req,
        res,
        pageId: req.params,
        error,
      });
      res.error = error.name;
      res.status(500);
      next(error);
    }
  },
  handleJourneyNext: async (req, res, next) => {
    try {
      await handleJourneyResponse(req, res, "journey/next");
    } catch (error) {
      next(error);
    }
  },
  handleJourneyResponse,
};
