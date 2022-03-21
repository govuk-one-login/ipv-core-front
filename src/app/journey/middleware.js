const axios = require("axios");
const {
  API_BASE_URL
} = require("../../lib/config");
const { getSharedAttributesJwt } = require("../shared/sharedAttributeHelper");
const { buildCredentialIssuerRedirectURL, redirectToAuthorize } = require("../shared/criHelper");

async function journeyApi(action, ipvSessionId) {
  if(action.startsWith('/')){
    action = action.substr(1);
  }

  return axios.post(
    `${API_BASE_URL}/journey/${action}`,
    {
      headers: {
        "ipv-session-id": ipvSessionId
      }
    }
  );
}

async function handleJourneyResponse(req, res, action) {
  const response = (await journeyApi(action, req.session.ipvSessionId)).data;

  if(response?.redirect?.event) {
    await handleJourneyResponse(req, res, response.redirect.event);
  }

  if(response?.redirect?.cri && validateCriResponse(response.redirect.cri, res)){
    await getSharedAttributesJwt(req, res);
    req.cri = response.redirect.cri;
    await buildCredentialIssuerRedirectURL(req, res)
    return redirectToAuthorize(req, res);
  }

  if(response.redirect?.client && validateClientResponse(response.redirect.client, res)) {
    const { callBackUrl, authCode} = response.redirect.client;
    return res.redirect(`${callBackUrl}?code=${authCode}`);
  }

  if (response?.page?.type) {
    return res.redirect(`/journey/journeyPage?pageId=${response.page.type}`);
  }
}

function validateCriResponse(criResponse, res) {
  if(!criResponse?.authorizeUrl) {
    res.error = 'AuthorizeUrl is missing'
    res.status(500);
    return false;
  }

  return true;
}

function validateClientResponse(client, res) {
  const { callBackUrl, authCode} = client;

  if(!callBackUrl) {
    res.error = 'CallBackUrl is missing'
    res.status(500);
    return false;
  }

  if(!authCode) {
    res.error = 'Authcode is missing'
    res.status(500);
    return false;
  }

  return true;
}



module.exports = {
  updateJourneyState: async (req, res, next) => {
    try {
      //valid list of allowed actions for route
      const allowedActions = ['/next']
      const validAction = allowedActions.find(x => x === req.url)

      if(validAction) {
        await handleJourneyResponse(req, res, validAction);
      } else {
        res.status(400)
      }

    } catch (error) {
      next(error);
    }

    next();
  },
  handleJourneyPage: async (req, res, next) => {
    try {
      const {pageId} = req.query;
      switch (pageId) {
        case 'transition':
          return res.render('journey/transition')
        default:
          return res.render(`journey/${pageId}`);
      }
    } catch (error) {
      res.error = error.name;
      res.status(500);
      next(error);
    }
  }
};
