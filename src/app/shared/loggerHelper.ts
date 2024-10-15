import { AxiosResponse } from "axios";
import { Request } from "express";

interface ApiCallContext {
  logCommunicationType: string;
  path: string;
  type?: string;
  info?: string;
  context?: string;
}

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

export const logCoreBackCall = (
  req: Request,
  context: ApiCallContext,
): void => {
  req.log.info({ message: context, level: "INFO", requestId: req.id });
};

export const getCriFromErrorResponse = (
  response: AxiosResponse,
): string | undefined => {
  try {
    const { config } = response;

    const requestDataString = config?.data;

    const credentialIssuerId =
      requestDataString && JSON.parse(requestDataString)?.credentialIssuerId;

    return credentialIssuerId;
    // An error here is not useful - this is used in error handling
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return undefined;
  }
};
