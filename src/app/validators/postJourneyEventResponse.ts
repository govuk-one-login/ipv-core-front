import { PageContextFor } from "../../types/page-contexts";
import { IpvPageName } from "../../constants/ipv-pages";

export interface CriResponse {
  cri: {
    id: string;
    redirectUrl: string;
  };
}

export interface PageResponse<T extends IpvPageName> {
  page: T;
  statusCode?: number;
  pageContext?: PageContextFor<T>;
  type?: string;
  clientOAuthSessionId?: string;
}

export interface JourneyResponse {
  journey: string;
  clientOAuthSessionId?: string;
}

export interface ClientResponse {
  client: { redirectUrl: string };
}

export type PostJourneyEventResponse =
  | JourneyResponse
  | PageResponse<IpvPageName>
  | CriResponse
  | ClientResponse;

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
): res is PageResponse<IpvPageName> => {
  return (res as PageResponse<IpvPageName>)?.page !== undefined;
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
