import { Request } from "express";

// PYIC-7573 This shouldn't be required if we handle errors intelligently in the error handlers
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

// PYIC-7573 This shouldn't be required if we just throw an appropriately typed error
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
