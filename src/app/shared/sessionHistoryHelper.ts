import { isPageResponse, PageResponse, PostJourneyEventResponse } from "../validators/postJourneyEventResponse";
import { Request } from "express";


export const addResponseToSessionHistory = (req: Request, data: PostJourneyEventResponse): void => {
  const current = req.session.currentPostJourneyEventResponse;
  let history = req.session.history;
  if (!history) {
    history = [];
  }
  if (current) {
    history.push(current);
  }
  req.session.history = history;
  req.session.currentPostJourneyEventResponse = data;
}

export const isPageRequestedFromSessionHistory = (
  req: Request,
  pageResponse: PageResponse,
): boolean => {
  const history = req.session.history;
  if (history && history.length > 0) {
    const last = history[history.length - 1];
    if (isPageResponse(last) && last.page === pageResponse.page) {
      return true;
    }
  }
  return false;
};

export const setLastAsCurrentPostEventResponse = (
  req: Request,
  postJourneyEventResponse: PostJourneyEventResponse,
): void => {
  const history = req.session?.history;
  if (history && history.length > 0) {
    const last = history[history.length - 1];
    if (
      isPageResponse(last) &&
      isPageResponse(postJourneyEventResponse) &&
      last?.page === postJourneyEventResponse.page
    ) {
      req.session.currentPostJourneyEventResponse = req.session.history?.pop();
      return;
    }
  }
};

export const removeLastFromSessionHistory = (
  req: Request,
  postJourneyEventResponse: PostJourneyEventResponse,
): void => {
  const history = req.session?.history;
  if (history && history.length > 0) {
    const last = history[history.length - 1];
    if (
      isPageResponse(last) &&
      isPageResponse(postJourneyEventResponse) &&
      last?.page === postJourneyEventResponse.page
    ) {
      req.session.history?.pop();
      return;
    }
  }
};
