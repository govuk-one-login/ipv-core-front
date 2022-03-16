const axios = require("axios");
const {
  API_BASE_URL
} = require("../../lib/config");
const { getSharedAttributesJwt } = require("../shared/sharedAttributeHelper");
const { buildCredentialIssuerRedirectURL } = require("../shared/criHelper");

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
  const response = await journeyApi(action, req.session.ipvSessionId);
  if (response.data?.redirect) {
    if(response.data?.redirect?.event) {
      await handleJourneyResponse(req, res, response?.data?.redirect?.event);
    }
    if(response.data?.redirect?.cri) {
      if(!response?.data?.redirect?.cri?.authorizeUrl) {
        res.error = 'AuthorizeUrl is missing'
        res.status(500);
        return;
      }

      await getSharedAttributesJwt(req, res);
      req.cri = response?.data?.redirect?.cri;
      await buildCredentialIssuerRedirectURL(req, res)
      return res.redirect(req.redirectURL);
    }
    return;
  }
  if (response?.data?.page?.type) {
    return res.redirect(`/journey/journeyPage?pageId=${response?.data?.page?.type}`);
  }
}

module.exports = {
  updateJourneyState: async (req, res, next) => {
    try {
      await handleJourneyResponse(req, res, req.baseURL);
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
