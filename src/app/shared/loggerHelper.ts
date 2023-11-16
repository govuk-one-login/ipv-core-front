export function transformError(error: any, messageContext: any) {
  if (error?.response?.status) {
    error.status = error?.response?.status;
  }

  if (messageContext) {
    error.messageContext = messageContext;
  }
}

export function logError(req: any, error: any, messageContext?: any)  {
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
}

export function logCoreBackCall(req: any, { logCommunicationType, type, path, info, requestId } : { 
  logCommunicationType: string, 
  type: string, 
  path: string, 
  info?: any,
  requestId?: string }
  ) {
  const message: any = {
    logCommunicationType,
    path,
    info,
  };
  if (type) {
    message.type = type;
  }
  req.log.info({ message, level: "INFO", requestId: req.id });
}
