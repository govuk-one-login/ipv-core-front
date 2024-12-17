import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";
import {
  specifyCreateRequest,
  specifyCreateResponse,
} from "../../test-utils/mock-express";

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
    expect(res.render).to.have.been.calledWith(
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

  it("should throw if template does not have a template-context mapping", async () => {
    // Arrange
    fsReadDirStub.readdir.resolves(["non-mapped-template.njk"]);

    // Act/Assert
    await expect(middleware.allTemplatesGet(req, res)).to.be.rejectedWith(
      Error,
      "Page non-mapped-template does not exist in the template and context mapping.",
    );
  });
});

describe("checkRequiredOptionsAreSelected", () => {
  const next: any = sinon.fake();

  [
    {
      testCase: "a template is not chosen",
      req: createRequest({ body: { template: undefined } }),
    },
    {
      testCase: "a template is chosen but a context is not",
      req: createRequest({
        body: { template: "another-template", pageContext: undefined },
      }),
    },
  ].forEach(({ testCase, req }) => {
    it(`should set error state to true when ${testCase}`, async () => {
      // Arrange
      const res = createResponse();
      // This will set the cached values for the template-context mapping and the template names
      await middleware.allTemplatesGet(req, res);

      // Act
      middleware.checkRequiredOptionsAreSelected(req, res, next);

      // Assert
      expect(res.locals.allTemplatesPageError).to.be.true;
      expect(next).to.have.been.called;
    });
  });

  it("should not set the error state when template and context have been selected", async () => {
    // Arrange
    const res = createResponse();
    const req = createRequest({
      body: { template: "another-template", pageContext: "context" },
    });

    // This will set the cached values for the template-context mapping and the template names
    await middleware.allTemplatesGet(req, res);

    // Act
    middleware.checkRequiredOptionsAreSelected(req, res, next);

    // Assert
    expect(res.locals.allTemplatesPageError).to.equal(undefined);
    expect(next).to.have.been.called;
  });
});

describe("allTemplatesPost", () => {
  const res = createResponse();

  beforeEach(async () => {
    // This will set the cached values for the template-context mapping and the template names
    const req = createRequest();
    await middleware.allTemplatesGet(req, res);
  });

  it("should render the all-templates page when error state has been set", async () => {
    // Arrange
    const req = createRequest();
    const res = createResponse({
      locals: { allTemplatesPageError: true },
    });

    // Act
    await middleware.allTemplatesPost(req, res);

    // Assert
    expect(res.render).to.have.been.calledWith(
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

  it("should redirect to the correct url if no error is set", async () => {
    // Arrange
    const req = createRequest({
      body: {
        template: "another-template",
        language: "en",
        pageContext: "context",
        hasErrorState: false,
      },
    });
    const res = createResponse();

    // Act
    await middleware.allTemplatesPost(req, res);

    // Assert
    expect(res.render).to.not.have.been.called;
    expect(res.redirect).to.have.been.calledWith(
      "/dev/template/another-template/en?context=context",
    );
  });
});
