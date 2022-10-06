module.exports = {
  transformError: (error, messageContext) => {
    if (error?.response?.status) {
      error.status = error?.response?.status;
    }

    if (messageContext) {
      error.messageContext = messageContext;
    }
  },
};
