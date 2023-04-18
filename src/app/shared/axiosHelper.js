module.exports = {
  generateAxiosConfig: (req) => {
    return {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "ipv-session-id": req.session.ipvSessionId,
        "client-session-id": req.session.clientSessionId,
        "x-request-id": req.id,
        "ip-address": req.session.ipAddress,
      },
    };
  },
  generateJsonAxiosConfig: (req) => {
    return {
      headers: {
        "Content-Type": "application/json",
        "ipv-session-id": req.session.ipvSessionId,
        "client-session-id": req.session.clientSessionId,
        "x-request-id": req.id,
        "ip-address": req.session.ipAddress,
      },
    };
  },
};
