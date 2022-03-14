const axios = require("axios");
const {
  API_BASE_URL
} = require("../../lib/config");


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

async function handleJourneyResponse(action, res, ipvSessionId) {
  const response = await journeyApi(action, ipvSessionId);
  if (response.data?.redirect) {
    if(response.data?.redirect?.event) {
      await handleJourneyResponse(response?.data?.redirect?.event, res);
    }
    if(response.data?.redirect?.cri) {
      if(!response?.data?.redirect?.cri?.authorizeUrl) {
        res.error = 'AuthorizeUrl is missing'
        res.status(500);
        return;
      }
      return res.redirect(`${response?.data?.redirect?.cri?.authorizeUrl}`);
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
      await handleJourneyResponse(req.baseURL, res, req.session.ipvSessionId);
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
