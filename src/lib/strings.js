const { randomBytes } = require("crypto");
module.exports = {
  generateNonce: function generateNonce() {
    return randomBytes(16).toString("hex");
  },
};
