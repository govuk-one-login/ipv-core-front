module.exports = {
  // Put the journey into the 'state' parameter of the request so that imposter sends it back as the IpvSessionId
  // See the readme and/or `imposter/config/api-config.yaml` for more information
  getAuthoriseUrlForJourney: (journey) => {
    return "/oauth2/authorize?response_type=code&redirect_uri=https%3A%2F%2Fexample.com&state=" + journey + "&scope=openid+phone+email4&request=FAKE_JAR&client_id=orchestrator";
  }
}
