module.exports = {
  getCSRFCookieOptions(isProdEnv) {
    return {
      httpOnly: isProdEnv,
      secure: isProdEnv,
    };
  },
};
