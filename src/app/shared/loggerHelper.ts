import { Request } from "express";

// For now, treat errors as any for simplicity
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const transformError = (error: any, messageContext?: string): void => {
  if (error?.response?.status) {
    error.status = error?.response?.status;
  }

  if (messageContext) {
    error.messageContext = messageContext;
  }
};

export const logError = (
  req: Request,
  // For now, treat errors as any for simplicity
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any,
  messageContext?: string,
): void => {
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
};
