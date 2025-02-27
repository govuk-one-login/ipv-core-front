import { expect } from "chai";
import sinon from "sinon";
import { checkFormRadioButtonSelected } from "../middleware";
import {
  specifyCreateRequest,
  specifyCreateResponse,
} from "../../../test-utils/mock-express";
import * as vcReceiptStatusMiddleware from "../../vc-receipt-status/middleware";

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
  const getAppVcReceiptStub: sinon.SinonStub = sinon.stub(
    vcReceiptStatusMiddleware,
    "getAppVcReceipt",
  );

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

  it("should call next if status is completed", async () => {
    // Arrange
    const req = createRequest({
      body: { journey: undefined },
      params: { pageId: "check-mobile-app-result" },
    });
    const res = createResponse();
    getAppVcReceiptStub.resolves("COMPLETED");

    // Act
    await checkFormRadioButtonSelected(req, res, next);

    // Assert
    expect(getAppVcReceiptStub).to.have.been.calledWith(req);
    expect(res.render).to.not.have.been.called;
    expect(next).to.have.been.calledOnce;
  });

  it("should call render page again if status is PROCESSING", async () => {
    // Arrange
    const req = createRequest({
      body: { journey: undefined },
      params: { pageId: "check-mobile-app-result" },
    });
    const res = createResponse();
    getAppVcReceiptStub.resolves("PROCESSING");

    // Act
    await checkFormRadioButtonSelected(req, res, next);

    // Assert
    expect(getAppVcReceiptStub).to.have.been.calledWith(req);
    expect(next).to.have.not.been.calledOnce;
  });

  it("should throw error if status is ERROR", async () => {
    // Arrange
    const req = createRequest({
      body: { journey: undefined },
      params: { pageId: "check-mobile-app-result" },
    });
    const res = createResponse();
    getAppVcReceiptStub.resolves("ERROR");

    // Act & Assert
    await expect(
      (async () => await checkFormRadioButtonSelected(req, res, next))(),
    ).to.be.rejectedWith(Error, "Failed to get VC response status");

    // Assert
    expect(getAppVcReceiptStub).to.have.been.calledWith(req);
    expect(res.render).to.not.have.been.called;
    expect(next).to.have.not.been.calledOnce;
  });
});
