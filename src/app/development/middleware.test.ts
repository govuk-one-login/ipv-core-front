import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";
import {
  specifyCreateRequest,
  specifyCreateResponse,
} from "../../test-utils/mock-express";
import type { i18n as I18nType } from "i18next";
import * as ipvMiddleware from "../ipv/middleware";
import * as userHelper from "../shared/reuseHelper";
import {
  generateUserDetails,
  samplePersistedUserDetails,
} from "../shared/reuseHelper";
import PAGES from "../../constants/ipv-pages";
import * as contextHelper from "../shared/contextHelper";
import * as qrCodeHelper from "../shared/qrCodeHelper";
import * as appDownloadHelper from "../shared/appDownloadHelper";

const createResponse = specifyCreateResponse();
const createRequest = specifyCreateRequest();

const fsReadDirStub = { readdir: sinon.stub() };
const pagesAndContextsStub = {
  pagesAndContexts: {
    "some-template": [],
    "another-template": ["context", undefined],
  },
};
const middleware = proxyquire("./middleware", {
  "../../test-utils/pages-and-contexts": pagesAndContextsStub,
  "fs/promises": fsReadDirStub,
});

beforeEach(() => {
  fsReadDirStub.readdir.resolves(["some-template.njk", "another-template.njk"]);
});

describe("allTemplatesGet", () => {
  // Arrange
  const req = createRequest();
  const res = createResponse();

  it("should render all-templates page with correct options", async () => {
    // Act
    await middleware.allTemplatesGet(req, res);

    // Assert
    expect(res.render).to.have.been.calledOnceWith(
      "development/all-templates.njk",
      {
        templatesWithContextRadioOptions: {
          "some-template": [],
          "another-template": [
            { text: "context", value: "context" },
            { text: "No context", value: "" },
          ],
        },
        csrfToken: undefined,
      },
    );
  });
});

describe("allTemplatesPost", () => {
  [
    {
      testCase: "a template is not chosen",
      req: createRequest({ body: { template: undefined } }),
    },
    {
      testCase:
        "a template is chosen but a context is not if there are context options",
      req: createRequest({
        body: { template: "another-template", pageContext: undefined },
      }),
    },
  ].forEach(({ testCase, req }) => {
    it(`should render the all-templates page when ${testCase}`, async () => {
      // Arrange
      const res = createResponse();

      // Act
      middleware.allTemplatesPost(req, res);

      // Assert
      expect(res.render).to.have.been.calledOnceWith(
        "development/all-templates.njk",
        {
          templatesWithContextRadioOptions: {
            "some-template": [],
            "another-template": [
              { text: "context", value: "context" },
              { text: "No context", value: "" },
            ],
          },
          csrfToken: undefined,
          errorState: true,
        },
      );
      expect(res.redirect).to.not.be.called;
    });
  });

  it("should redirect to the correct url if template, context and error state have been chosen", async () => {
    // Arrange
    const req = createRequest({
      body: {
        template: "another-template",
        language: "en",
        pageContext: "context",
        hasErrorState: true,
      },
    });
    const res = createResponse();

    // Act
    await middleware.allTemplatesPost(req, res);

    // Assert
    expect(res.render).to.not.have.been.called;
    expect(res.redirect).to.have.been.calledOnceWith(
      "/dev/template/another-template/en?context=context&pageErrorState=true",
    );
  });

  it("should redirect to the correct url if template is chosen with no available contexts", async () => {
    // Arrange
    const req = createRequest({
      body: {
        template: "some-template",
        language: "en",
        hasErrorState: false,
      },
    });
    const res = createResponse();

    // Act
    await middleware.allTemplatesPost(req, res);

    // Assert
    expect(res.render).to.not.have.been.called;
    expect(res.redirect).to.have.been.calledOnceWith(
      "/dev/template/some-template/en",
    );
  });
});

describe("templatesDisplayGet", () => {
  it("should get phone type and generate QR code for PYI_TRIAGE_DESKTOP_DOWNLOAD_APP", async () => {
    // Arrange
    const context = "iphone-appOnly";
    const validPhoneType = "iphone";
    const req = createRequest({
      params: {
        templateId: PAGES.PYI_TRIAGE_DESKTOP_DOWNLOAD_APP,
        language: "en",
      },
      query: {
        context,
      },
    });

    req.i18n = {
      changeLanguage: sinon.stub().resolves(),
    } as unknown as I18nType;
    req.csrfToken = sinon.stub().returns(undefined);

    const res = createResponse();

    // Stub out the helpers
    const getPhoneTypeStub = sinon
      .stub(contextHelper, "getPhoneType")
      .returns(validPhoneType as any);
    const generateQrCodeStub = sinon
      .stub(qrCodeHelper, "generateQrCodeImageData")
      .resolves("mockedQrCode");
    const getAppStoreRedirectUrlStub = sinon
      .stub(appDownloadHelper, "getAppStoreRedirectUrl")
      .returns("mockedAppStoreUrl");

    // Act
    await middleware.templatesDisplayGet(req, res);

    // Assert
    expect(getPhoneTypeStub).to.have.been.calledOnceWith(context);
    expect(getAppStoreRedirectUrlStub).to.have.been.calledOnceWith(
      validPhoneType,
    );
    expect(generateQrCodeStub).to.have.been.calledOnceWith("mockedAppStoreUrl");

    expect(res.render).to.have.been.calledWithMatch(
      sinon.match.string,
      sinon.match.has("qrCode", "mockedQrCode"),
    );

    // Cleanup
    getPhoneTypeStub.restore();
    generateQrCodeStub.restore();
    getAppStoreRedirectUrlStub.restore();
  });

  it("should add userDetails to render options if pageRequiresUserDetails returns true", async () => {
    // Arrange
    const req = createRequest({
      params: {
        templateId: "some-user-page",
        language: "en",
      },
      query: {},
    });

    req.i18n = {
      changeLanguage: sinon.stub().resolves(),
      t: sinon.stub().callsFake((key) => key),
    } as unknown as I18nType;

    req.csrfToken = sinon.stub().returns(undefined);

    const res = createResponse();
    const userDetailsStub = generateUserDetails(
      samplePersistedUserDetails,
      req.i18n,
    );
    const pageRequiresUserDetailsStub = sinon
      .stub(ipvMiddleware, "pageRequiresUserDetails")
      .returns(true);
    const generateUserDetailsStub = sinon
      .stub(userHelper, "generateUserDetails")
      .returns(userDetailsStub);

    // Act
    await middleware.templatesDisplayGet(req, res);

    // Assert
    expect(req.i18n.changeLanguage).to.have.been.calledOnceWith("en");
    expect(res.render).to.have.been.calledOnceWith(
      "ipv/page/some-user-page.njk",
      sinon.match({
        templateId: "some-user-page",
        csrfToken: undefined,
        userDetails: userDetailsStub,
        context: undefined,
        errorState: undefined,
        pageErrorState: undefined,
      }),
    );

    // Cleanup
    pageRequiresUserDetailsStub.restore();
    generateUserDetailsStub.restore();
  });

  it("should render error page template if templateId is in errorTemplates", async () => {
    // Arrange
    const req = createRequest({
      params: {
        templateId: "session-ended",
        language: "en",
      },
      query: {},
    });

    req.i18n = {
      changeLanguage: sinon.stub().resolves(),
    } as unknown as I18nType;

    const csrfTokenStub = sinon.stub().returns("test-token");
    req.csrfToken = csrfTokenStub;

    const res = createResponse();

    // Act
    await middleware.templatesDisplayGet(req, res);

    // Assert
    expect(req.i18n.changeLanguage).to.have.been.calledOnceWith("en");
    expect(res.render).to.have.been.calledOnceWith(
      "errors/session-ended.njk",
      sinon.match({
        csrfToken: "test-token",
        templateId: "session-ended",
        context: undefined,
        errorState: undefined,
        pageErrorState: undefined,
      }),
    );
  });

  it("should render service-unavailable page using getHtmlPath if templateId is service-unavailable", async () => {
    // Arrange
    const req = createRequest({
      params: {
        templateId: "service-unavailable",
        language: "en",
      },
      query: {},
    });

    req.i18n = {
      changeLanguage: sinon.stub().resolves(),
    } as unknown as I18nType;

    const res = createResponse();

    // Act
    await middleware.templatesDisplayGet(req, res);

    // Assert
    expect(req.i18n.changeLanguage).to.have.been.calledOnceWith("en");
    expect(res.render).to.have.been.calledOnceWith("service-unavailable.html");
  });
});
