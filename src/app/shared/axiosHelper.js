module.exports = {
  generateAxiosConfig: (req) => {
    return {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "ipv-session-id": req.session.ipvSessionId,
        "x-request-Id": req.requestId,
      },
    };
  },
  generateJsonAxiosConfig: (sessionId) => {
    return {
      headers: {
        "Content-Type": "application/json",
        "ipv-session-id": sessionId,
      },
    };
  },
};
