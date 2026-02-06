import { Response } from "express";
import proxyquire from "proxyquire";
import sinon from "sinon";

const configStub = {
  API_BASE_URL: "https://example.com/api-base",
  SERVICE_URL: "https://example.com/service",
  CONTACT_URL: "https://example.com/contact-us",
  DELETE_ACCOUNT_URL: "https://example.com/delete-account",
  DT_RUM_URL: "https://example.com/dt-url",
  LOGOUT_URL: "https://example.com/logout",
  GTM_ANALYTICS_COOKIE_DOMAIN: "https://example.com/analytics",
  GTM_ID: "test-ua-id",
  GTM_ID_GA4: "test-ga4-id",
  SERVICE_DOMAIN: "localhost",
  DEVICE_INTELLIGENCE_COOKIE_DOMAIN: "localhost",
  GA4_DISABLED: "true",
  ANALYTICS_DATA_SENSITIVE: "false",
  UA_DISABLED: "false",
};

const { setLocals } = proxyquire("./locals", {
  "../config/config": { default: configStub },
}) as typeof import("./locals");

describe("locals helper", () => {
  it("sets locals from config", async () => {
    const req = {
      originalUrl: "http://example.com/original",
    } as any;
    const res = {
      locals: {},
    } as Response;
    const next = sinon.fake();

    await setLocals(req, res, next);

    expect(res.locals).to.deep.equal({
      analyticsCookieDomain: "https://example.com/analytics",
      contactUsUrl:
        "https://example.com/contact-us?fromUrl=https%3A%2F%2Fexample.com%2Fservicehttp%3A%2F%2Fexample.com%2Foriginal",
      cspNonce: res.locals.cspNonce,
      deleteAccountUrl: "https://example.com/delete-account",
      dynatraceRumUrl: "https://example.com/dt-url",
      ga4ContainerId: "test-ga4-id",
      isGa4Enabled: false,
      analyticsDataSensitive: false,
      isUaEnabled: true,
      logoutUrl: "https://example.com/logout",
      deviceIntelligenceCookieDomain: "localhost",
      uaContainerId: "test-ua-id",
    });

    expect(res.locals.cspNonce).is.ok;
  });

  it("patches statusCode to make it available in locals", async () => {
    const statusSpy = sinon.fake();
    const req = {
      originalUrl: "http://example.com/original",
    } as any;
    const res = {
      locals: {},
      status: statusSpy,
    } as any;
    const next = sinon.fake();

    await setLocals(req, res, next);

    res.status(418);

    expect(statusSpy).to.have.been.calledWith(418);
    expect(res.locals.statusCode).to.equal(418);
  });
});
