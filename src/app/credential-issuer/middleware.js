const {
  CREDENTIAL_ISSUER_BASE_URL,
  CREDENTIAL_ISSUER_AUTH_PATH
 } = require("../../lib/config");


const redirectToAuthorize = async (req, res) => {
const redirectURL = `${CREDENTIAL_ISSUER_BASE_URL}${CREDENTIAL_ISSUER_AUTH_PATH}`;
  res.redirect(redirectURL);
}
module.exports = redirectToAuthorize
