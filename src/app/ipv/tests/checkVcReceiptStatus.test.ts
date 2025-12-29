import { expect } from "chai";
import sinon from "sinon";
import { checkVcReceiptStatus } from "../middleware";
import {
  specifyCreateRequest,
  specifyCreateResponse,
} from "../../../test-utils/mock-express";
import * as vcReceiptStatusMiddleware from "../../vc-receipt-status/middleware";

describe("checkVcReceiptStatus middleware", () => {
  // Mock handler parameters
  const createRequest = specifyCreateRequest({
    params: { pageId: "check-mobile-app-result" },
    body: { journey: undefined },
    session: {
      currentPage: "check-mobile-app-result",
      ipvSessionId: "ipv-session-id",
      save: sinon.fake.yields(null),
    },
  });
  const createResponse = specifyCreateResponse();
  const next: any = sinon.fake();
  const getAppVcReceiptStatusAndStoreJourneyResponseStub: sinon.SinonStub =
    sinon.stub(
      vcReceiptStatusMiddleware,
      "getAppVcReceiptStatusAndStoreJourneyResponse",
    );

  beforeEach(() => {
    next.resetHistory();
  });

  it("should call next if status is completed", async () => {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    getAppVcReceiptStatusAndStoreJourneyResponseStub.resolves("COMPLETED");

    // Act
    await checkVcReceiptStatus(req, res, next);

    // Assert
    expect(
      getAppVcReceiptStatusAndStoreJourneyResponseStub,
    ).to.have.been.calledWith(req);
    expect(res.render).to.not.have.been.called;
    expect(next).to.have.been.calledOnce;
  });

  it("should call render page again if status is PROCESSING", async () => {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    getAppVcReceiptStatusAndStoreJourneyResponseStub.resolves("PROCESSING");

    // Act
    await checkVcReceiptStatus(req, res, next);

    // Assert
    expect(
      getAppVcReceiptStatusAndStoreJourneyResponseStub,
    ).to.have.been.calledWith(req);
    expect(res.render).to.have.been.called;
    expect(next).to.have.not.been.calledOnce;
  });

  it("should throw error if status is SERVER_ERROR", async () => {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    getAppVcReceiptStatusAndStoreJourneyResponseStub.resolves("SERVER_ERROR");

    // Act & Assert
    await expect(
      (async () => await checkVcReceiptStatus(req, res, next))(),
    ).to.be.rejectedWith(Error, "Failed to get VC response status");

    // Assert
    expect(
      getAppVcReceiptStatusAndStoreJourneyResponseStub,
    ).to.have.been.calledWith(req);
    expect(res.render).to.not.have.been.called;
    expect(next).to.have.not.been.calledOnce;
  });

  it("should throw client error if status is CLIENT_ERROR", async () => {
    // Arrange
    const req = createRequest();
    const res = createResponse();
    getAppVcReceiptStatusAndStoreJourneyResponseStub.resolves("CLIENT_ERROR");

    // Act & Assert
    await expect(
      (async () => await checkVcReceiptStatus(req, res, next))(),
    ).to.be.rejectedWith(Error, "Failed to get VC response status");

    // Assert
    expect(
      getAppVcReceiptStatusAndStoreJourneyResponseStub,
    ).to.have.been.calledWith(req);
    expect(res.render).to.not.have.been.called;
    expect(next).to.have.not.been.calledOnce;
  });
});
