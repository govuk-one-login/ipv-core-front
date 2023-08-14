module.exports = {
  securityHeaders: (req, res, next) => {
    res.set({
      "Strict-Transport-Security": "max-age=31536000",
      "Content-Security-Policy": "default-src 'self';",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "0",
      "X-Content-Type-Options": "nosniff",
    });
    res.removeHeader("X-Powered-By");
    next();
  },
};
