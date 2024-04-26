function MissingIpvSessionIdError() {}
MissingIpvSessionIdError.prototype = new Error("req.ipvSessionId is missing");

module.exports = {
  MissingIpvSessionIdError,
};
