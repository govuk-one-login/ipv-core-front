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
}

export interface JourneyResponse {
  journey: string;
}

export interface ClientResponse {
  client: { redirectUrl: string };
}

export type PostJourneyEventResponse =
  | JourneyResponse
  | PageResponse
  | CriResponse
  | ClientResponse;

export const isJourneyResponse = (
  res: PostJourneyEventResponse,
): res is JourneyResponse => {
  return (res as JourneyResponse).journey !== undefined;
};

export const isCriResponse = (
  res: PostJourneyEventResponse,
): res is CriResponse => {
  return (res as CriResponse).cri !== undefined;
};

export const isClientResponse = (
  res: PostJourneyEventResponse,
): res is ClientResponse => {
  return (res as ClientResponse).client !== undefined;
};

export const isPageResponse = (
  res: PostJourneyEventResponse,
): res is PageResponse => {
  return (res as PageResponse).page !== undefined;
};
