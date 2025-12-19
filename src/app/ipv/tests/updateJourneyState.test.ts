import { expect } from "chai";
import sinon from "sinon";
import { updateJourneyState } from "../middleware";
import * as coreBackService from "../../../services/coreBackService";
import NotFoundError from "../../../errors/not-found-error";
import {
  specifyCreateRequest,
  specifyCreateResponse,
} from "../../../test-utils/mock-express";
import { AxiosResponse } from "axios";

describe("updateJourneyState", () => {
  const createRequest = specifyCreateRequest({
    session: {
      ipvSessionId: "ipv-session-id",
      ipAddress: "ip-address",
      save: sinon.fake.yields(null),
    },
  });
  const createResponse = specifyCreateResponse();
  const next: any = sinon.fake();

  beforeEach(() => {
    sinon.restore();
    next.resetHistory();
  });

  it("should call processAction and redirect if pageId is valid and action is provided", async () => {
    // Arrange
    const req = createRequest({
      params: {
        pageId: "prove-identity-no-photo-id",
        action: "next",
      },
    });
    const res = createResponse();

    sinon.stub(coreBackService, "postJourneyEvent").resolves({
      data: {
        page: "some-next-page",
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {},
    } as AxiosResponse);

    // Act
    await updateJourneyState(req, res, next);

    // Assert
    expect(res.redirect).to.have.been.calledOnceWith("/ipv/page/some-next-page");
  });

  it("should throw NotFoundError if pageId is invalid", async () => {
    // Arrange
    const req = createRequest({
      params: {
        pageId: "invalid-page-id",
        action: "next",
      },
    });
    const res = createResponse();

    // Act & Assert
    await expect(updateJourneyState(req, res, next)).to.be.rejectedWith(
      NotFoundError,
      "Invalid page id",
    );
  });
});
