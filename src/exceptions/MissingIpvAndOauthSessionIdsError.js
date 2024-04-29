function MissingIpvAndOauthSessionIdsError() {
  return true;
}
MissingIpvAndOauthSessionIdsError.prototype = new Error(
  "req.ipvSessionId and req.clientOauthSessionId is missing",
);

module.exports = {
  MissingIpvAndOauthSessionIdsError,
};
