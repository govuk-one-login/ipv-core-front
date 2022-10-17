module.exports = {
  generateAxiosConfig: (sessionId) => {
    return {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "ipv-session-id": sessionId,
      },
    };
  },
  generateJsonAxiosConfig: (sessionId) => {
    return {
      headers: {
        "Content-Type": "application/json",
        "ipv-session-id": sessionId,
      },
    };
  },
};
