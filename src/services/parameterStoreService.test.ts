import { expect } from "chai";
import sinon from "sinon";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { getParameter } from "./parameterStoreService";

describe("parameterStoreService", () => {
  describe("getParameter", () => {
    let sendStub: sinon.SinonStub;
    let ssmClientStub: sinon.SinonStub;

    beforeEach(() => {
      sendStub = sinon.stub();
      ssmClientStub = sinon
        .stub(SSMClient.prototype, "send")
        .callsFake(sendStub);
    });

    afterEach(() => {
      sinon.restore();
    });

    it("should return undefined if no data is returned from SSM", async () => {
      sendStub.resolves({ Parameter: { Value: undefined } });
      const result = await getParameter("/core-front/test-parameter");
      expect(result).to.be.undefined;
    });

    it("should return parsed data from SSM", async () => {
      sinon.useFakeTimers(Date.now() + 1000 * 60 * 60 * 24);
      sendStub.resolves({
        Parameter: {
          Value: JSON.stringify([
            {
              pageId: "/some-page",
              bannerMessage: "Test banner",
              bannerMessageCy: "Welsh Test banner",
              startTime: new Date(Date.now()).toISOString(),
              endTime: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
            },
          ]),
        },
      });

      const result = await getParameter("/core-front/test-parameter");
      const param = result ? JSON.parse(result) : undefined;

      expect(param[0]).to.deep.include({
        pageId: "/some-page",
        bannerMessage: "Test banner",
        bannerMessageCy: "Welsh Test banner",
      });

      expect(ssmClientStub).to.have.been.calledOnceWithExactly(
        sinon.match.instanceOf(GetParameterCommand),
      );
    });

    it("should return value from cache", async () => {
      const result = await getParameter("/core-front/test-parameter");
      const param = result ? JSON.parse(result) : undefined;

      expect(param[0]).to.deep.include({
        pageId: "/some-page",
        bannerMessage: "Test banner",
        bannerMessageCy: "Welsh Test banner",
      });
      expect(
        ssmClientStub.calledWithMatch({
          Name: "/core-front/test-parameter",
        }),
      ).to.be.false;
    });
  });
});