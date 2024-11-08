import { expect } from "chai";
import sinon from "sinon";
import { checkFormRadioButtonSelected } from "../middleware";
import {
  specifyCreateRequest,
  specifyCreateResponse,
} from "../../../test-utils/mock-express";

describe("checkFormRadioButtonSelected middleware", () => {
  // Mock handler parameters
  const createRequest = specifyCreateRequest({
    params: { pageId: "page-ipv-identity-document-start" },
    session: {
      currentPage: "page-ipv-identity-document-start",
      ipvSessionId: "ipv-session-id",
      save: sinon.fake.yields(null),
    },
  });
  const createResponse = specifyCreateResponse();
  const next: any = sinon.fake();

  beforeEach(() => {
    next.resetHistory();
  });

  it("should render form page again with error if no option is selected", async function () {
    // Arrange
    const req = createRequest();
    const res = createResponse();

    // Act
    await checkFormRadioButtonSelected(req, res, next);

    // Assert
    expect(res.render).to.have.been.calledWith(
      `ipv/page/${req.session.currentPage}.njk`,
      {
        pageId: req.session.currentPage,
        csrfToken: undefined,
        context: undefined,
        pageErrorState: true,
      },
    );
    expect(next).to.have.not.been.calledOnce;
  });

  it("should pass to next if an option is selected", async function () {
    // Arrange
    const req = createRequest({ body: { journey: "someJourney" } });
    const res = createResponse();

    // Act
    await checkFormRadioButtonSelected(req, res, next);

    // Assert
    expect(res.render).to.not.have.been.called;
    expect(next).to.have.been.calledOnce;
  });
});
