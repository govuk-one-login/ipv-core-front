import { Request, Response } from "express";
import sinon from "sinon";

interface CreateRequestParams {
  body?: Record<string, unknown>;
  params?: Record<string, string>;
  query?: Record<string, unknown>;
  headers?: Record<string, string>;
  session?: Record<string, unknown>;
  method?: string;
  path?: string;
  id?: string;
  ip?: string;
  cookies?: Record<string, unknown>;
}

export const specifyCreateRequest =
  (defaultParams: CreateRequestParams = {}) =>
  (params: CreateRequestParams = {}): Request => {
    function mergeParams<
      T extends "body" | "params" | "query" | "headers" | "session" | "cookies",
    >(attribute: T): CreateRequestParams[T] {
      if (!Object.hasOwn(params, attribute)) {
        return defaultParams[attribute] ?? {};
      }
      return (
        params[attribute] && {
          ...(defaultParams[attribute] ?? {}),
          ...params[attribute],
        }
      );
    }

    return {
      body: mergeParams("body"),
      params: mergeParams("params"),
      query: mergeParams("query"),
      headers: mergeParams("headers"),
      session: mergeParams("session"),
      method: params.method ?? defaultParams.method ?? "GET",
      path: params.path ?? defaultParams.path ?? "GET",
      log: { info: sinon.fake(), error: sinon.fake(), warn: sinon.fake() },
      csrfToken: sinon.fake(),
      i18n: { t: () => "Some label" },
      id: params.id ?? defaultParams.id,
      ip: params.ip ?? defaultParams.ip,
      cookies: mergeParams("cookies"),
    } as unknown as Request;
  };

type CreateResponseParams = {
  statusCode?: number;
  headersSent?: boolean;
  locals?: object;
};

export const specifyCreateResponse =
  () =>
  (params: CreateResponseParams = {}): Response =>
    ({
      status: sinon.fake(),
      redirect: sinon.fake(),
      send: sinon.fake(),
      render: sinon.fake(),
      sendFile: sinon.fake(),
      locals: { contactUsUrl: "contactUrl", deleteAccountUrl: "deleteAccount" },
      log: { info: sinon.fake(), error: sinon.fake() },
      set: sinon.fake(),
      removeHeader: sinon.fake(),
      ...params,
    }) as unknown as Response;
