/*eslint no-unused-vars: ["error", { "varsIgnorePattern": "request|response" }]*/
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
  getMiddlewareErrorHandlerMessage: (err, description) => {
    const { config, request, response, ...desiredErrorProperties } = err;

    const requestDataString = config?.data;

    const credentialIssuerId =
      requestDataString && JSON.parse(requestDataString)?.credentialIssuerId;

    const message = {
      err: desiredErrorProperties,
      response: err?.response?.data,
      description: description,
    };

    if (credentialIssuerId) {
      message.err.credentialIssuerId = credentialIssuerId;
    }

    return message;
  },
};
