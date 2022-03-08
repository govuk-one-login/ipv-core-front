const axios = require("axios");
const {
  API_BASE_URL
} = require("../../lib/config");


async function journeyApi(action, ipvSessionId) {
  if(action.startsWith('/')){
    action = action.substr(1);
  }
  return await axios.post(
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
  if (response.data?.redirect?.event) {
    await handleJourneyResponse(response?.data?.redirect?.event, res);
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
        return res.render('journey/transition', {message: 'You are about to be transitioned'})
      }
    }catch (error) {
      res.error = error.name;
      return next(error);
    }
    next()
  }
};


