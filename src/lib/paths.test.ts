import {
  getErrorPageTemplatePath,
  getHtmlPath,
  getIpvPagePath,
  getIpvPageTemplatePath,
} from "./paths";

const TEST_PAGE_ID = "test-page";

describe("paths helper", () => {
  it("builds a page url path", () => {
    const templatePath = getIpvPagePath(TEST_PAGE_ID);

    expect(templatePath).to.equal("/ipv/page/test-page");
  });

  it("builds a page template path", () => {
    const templatePath = getIpvPageTemplatePath(TEST_PAGE_ID);

    expect(templatePath).to.equal("ipv/page/test-page.njk");
  });

  it("builds an error template path", () => {
    const templatePath = getErrorPageTemplatePath(TEST_PAGE_ID);

    expect(templatePath).to.equal("errors/test-page.njk");
  });

  it("builds a html path", () => {
    const templatePath = getHtmlPath("errors", TEST_PAGE_ID);

    expect(templatePath).to.equal("errors/test-page.html");
  })
});
