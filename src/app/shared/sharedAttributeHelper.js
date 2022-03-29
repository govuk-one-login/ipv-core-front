const axios = require("axios");
const {
  API_BASE_URL,
  API_SHARED_ATTRIBUTES_JWT_PATH,
  SHARED_ATTRIBUTES_JWT_SIZE_LIMIT
} = require("../../lib/config");

module.exports = {
  getSharedAttributesJwt: async (req, res, next) =>  {
    try {
      const apiResponse = await axios.get(
        `${API_BASE_URL}${API_SHARED_ATTRIBUTES_JWT_PATH}`,
        {
          headers: {
            "ipv-session-id": req.session.ipvSessionId
          }
        }
      );

      const sharedAttributesJwt = apiResponse?.data;
      const base64regex = /^([A-Za-z0-9-_=]+\.){2}([A-Za-z0-9-_=]+)$/;

      if (!sharedAttributesJwt) {
        res.status(500);
        return res.send("Missing JWT");
      } else if (sharedAttributesJwt.length > SHARED_ATTRIBUTES_JWT_SIZE_LIMIT) {
        res.status(500);
        return res.send("JWT exceeds maximum limit");
      } else if (!base64regex.test(sharedAttributesJwt)) {
        res.status(500);
        return res.send("Invalid base64 encoded JWT");
      }

      req.session.sharedAttributesJwt = sharedAttributesJwt;

      if (next) {
        next();
      }
    } catch (e) {
      if (next) {
        next(e);
      }
    }
  },
}
