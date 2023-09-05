const unknown = "unknown";
const IPV4_MATCH = "\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b";

module.exports = {
  getIpAddress: (req) => {
    const headerForward = req.headers && (req.headers["forwarded"] || req.headers["x-forwarded-for"]);
    if (headerForward) {
      const ipAddress = headerForward.match(IPV4_MATCH);
      if (ipAddress) {
        return ipAddress[0];
      }
    }
    return unknown;
  },
};
