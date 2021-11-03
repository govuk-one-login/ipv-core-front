async function authorize(req, res) {
  const authParams = {
    response_type: req.query.response_type,
    redirect_uri: req.query.redirect_uri,
    state: req.query.state,
    client_id: req.query.client_id,
    claims: req.query.claims,
  };

  res.redirect(`${authParams.redirect_uri}?error=access_denied`);
}

module.exports = {
  authorize,
};
