function MissingIpvAndOauthSessionIdsError() {}
MissingIpvAndOauthSessionIdsError.prototype = new Error(
  "req.ipvSessionId and req.clientOauthSessionId is missing",
);

module.exports = {
  MissingIpvAndOauthSessionIdsError,
};
