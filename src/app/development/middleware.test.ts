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
});

describe("allTemplatesPost", () => {
  const res = createResponse();

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
      // Act
      middleware.allTemplatesPost(req, res);

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
  });

  it("should redirect to the correct url if template and context have been chosen", async () => {
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
    expect(res.redirect).to.have.been.calledWith(
      "/dev/template/some-template/en",
    );
  });
});
