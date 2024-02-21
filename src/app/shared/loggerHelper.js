module.exports = {
  transformError: (error, messageContext) => {
    if (error?.response?.status) {
      error.status = error?.response?.status;
    }

    if (messageContext) {
      error.messageContext = messageContext;
    }
  },
  logError: (req, error, messageContext) => {
    if (error?.response?.status) {
      error.status = error?.response?.status;
    }

    req.log.error({
      error,
      message: {
        errorMessageContext: messageContext,
        errorMessage: error.message,
      },
      level: "ERROR",
      requestId: req.id,
    });
  },
  logCoreBackCall: (
    req,
    { logCommunicationType, type, path, info, context },
  ) => {
    const message = {
      logCommunicationType,
      path,
      info,
    };
    if (type) {
      message.type = type;
    }
    if (context !== "") {
      message.context = context;
    }
    req.log.info({ message, level: "INFO", requestId: req.id });
  },
  getCriFromErrorResponse: (err) => {
    const { config } = err;

    const requestDataString = config?.data;

    const credentialIssuerId =
      requestDataString && JSON.parse(requestDataString)?.credentialIssuerId;

    return credentialIssuerId
  },
};
