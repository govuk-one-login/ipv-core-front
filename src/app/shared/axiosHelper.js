module.exports = {
  generateAxiosConfig: (sessionId) => {
    return {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "ipv-session-id": sessionId,
      },
    };
  },
};
