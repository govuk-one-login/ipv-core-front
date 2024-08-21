const { promisify } = require("util");
const { randomBytes } = require("crypto");

const asyncRandomBytes = promisify(randomBytes);

module.exports = {
  generateNonce: async function generateNonce() {
    return (await asyncRandomBytes(16)).toString("hex");
  },
};
