export interface CriResponse {
  cri: {
    id: string;
    redirectUrl: string;
  };
}

export interface PageResponse {
  page: string;
  statusCode?: number;
  context?: string;
  type?: string;
  clientOAuthSessionId?: string;
  skipBack: boolean;
}

export interface JourneyResponse {
  journey: string;
  clientOAuthSessionId?: string;
}

export interface ClientResponse {
  client: { redirectUrl: string };
}

export interface ErrorResponse {
  errorMessage: string;
  errorCode: number;
  statusCode: number;
}

export type PostJourneyEventResponse =
  | JourneyResponse
  | PageResponse
  | CriResponse
  | ClientResponse
  | ErrorResponse;

export const isJourneyResponse = (
  res: PostJourneyEventResponse,
): res is JourneyResponse => {
  return (res as JourneyResponse)?.journey !== undefined;
};

export const isCriResponse = (
  res: PostJourneyEventResponse,
): res is CriResponse => {
  return (res as CriResponse)?.cri !== undefined;
};

export const isClientResponse = (
  res: PostJourneyEventResponse,
): res is ClientResponse => {
  return (res as ClientResponse)?.client !== undefined;
};

export const isPageResponse = (
  res: PostJourneyEventResponse,
): res is PageResponse => {
  return (res as PageResponse)?.page !== undefined;
};

export const isErrorResponse = (
  res: PostJourneyEventResponse,
): res is ErrorResponse => {
  return (res as ErrorResponse)?.errorCode !== undefined;
};

export const isValidCriResponse = (criResponse: CriResponse): boolean => {
  if (!criResponse.cri.redirectUrl) {
    throw new Error("CRI response RedirectUrl is missing");
  }

  return true;
};

export const isValidClientResponse = (client: ClientResponse): boolean => {
  const {
    client: { redirectUrl },
  } = client;

  if (!redirectUrl) {
    throw new Error("Client Response redirect url is missing");
  }

  return true;
};
