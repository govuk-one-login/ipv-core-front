const unknown = "unknown";
const IPV4_MATCH = "\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b";

module.exports = {
  getIpAddress: (req) => {
    if (req.headers && req.headers["forwarded"]) {
      const ipAddress = req.headers["forwarded"].match(IPV4_MATCH);
      if (ipAddress) {
        return ipAddress[0];
      } else {
        return unknown;
      }
    } else {
      return unknown;
    }
  },
};
