const axios = require("axios");
const {
  API_BASE_URL
} = require("../../lib/config");
const { buildCredentialIssuerRedirectURL, redirectToAuthorize } = require("../shared/criHelper");
const { generateAxiosConfig } = require("../shared/axiosHelper");

async function journeyApi(action, ipvSessionId) {
  if(action.startsWith('/')){
    action = action.substr(1);
  }

  return axios.post(
    `${API_BASE_URL}/${action}`,
    {},
    generateAxiosConfig(ipvSessionId)
  );
}

async function handleJourneyResponse(req, res, action) {
  const response = (await journeyApi(action, req.session.ipvSessionId)).data;

  if(response?.journey) {
    await handleJourneyResponse(req, res, response.journey);
  }

  if(response?.cri && tryValidateCriResponse(response.cri)){
    req.cri = response.cri;
    await buildCredentialIssuerRedirectURL(req, res)
    return redirectToAuthorize(req, res);
  }

  if(response?.client && tryValidateClientResponse(response.client)) {
    const { redirectUrl } = response.client;
    return res.redirect(redirectUrl);
  }

  if (response?.page) {
     return res.redirect(`/ipv/journeyPage?pageId=${response.page}`);
  }
}

function tryValidateCriResponse(criResponse) {
  if(!criResponse?.authorizeUrl) {
    throw new Error(`CRI response AuthorizeUrl is missing`)
  }

  return true;
}

function tryValidateClientResponse(client) {
  const { redirectUrl } = client;

  if(!redirectUrl) {
    throw new Error(`Client Response redirect url is missing`)
  }

  return true;
}

module.exports = {
  updateJourneyState: async (req, res, next) => {
    try {
      //valid list of allowed actions for route
      const allowedActions = ['/journey/next', '/journey/error', '/journey/cri/start/ukPassport', '/journey/cri/start/fraud', '/journey/cri/start/address', '/journey/cri/start/kbv', '/journey/cri/start/activityHistory', '/journey/cri/start/debugAddress', '/journey/session/end']
      const validAction = allowedActions.find(x => x === req.url)

      if(validAction) {
        await handleJourneyResponse(req, res, validAction);
      } else {
        next(new Error(`Action ${req.url} not valid`));
      }

    } catch (error) {
      next(error);
    }

  },
  handleJourneyPage: async (req, res, next) => {
    try {
      const {pageId} = req.query;
      switch (pageId) {
        case 'page-ipv-debug':
          return res.redirect("/debug");
        case 'page-transition-default':
          return res.render('ipv/page-transition-default')
        default:
          return res.render(`ipv/${pageId}`);
      }
    } catch (error) {
      res.error = error.name;
      res.status(500);
      next(error);
    }
  }
};
