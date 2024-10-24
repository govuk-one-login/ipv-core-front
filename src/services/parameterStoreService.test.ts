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

    it("should return parsed local environment variable when NODE_ENV is local", async () => {
      process.env.NODE_ENV = "local";
      process.env["notification-banner"] = JSON.stringify({
        pageId: "/some-page",
        bannerMessage: "Test banner",
        bannerMessageCy: "Welsh Test banner",
        startTime: Date.now(),
        endTime: Date.now() + 1000 * 60 * 60 * 24,
      });

      const result = await getParameter("notification-banner");

      expect(result).to.deep.include({
        pageId: "/some-page",
        bannerMessage: "Test banner",
        bannerMessageCy: "Welsh Test banner",
      });
      expect(result?.startTime).to.be.a("number");
      expect(result?.endTime).to.be.a("number");
    });

    it("should return undefined if NODE_ENV is not local and no data is returned from SSM", async () => {
      process.env.NODE_ENV = "production";
      sendStub.resolves({ Parameter: { Value: undefined } });
      const result = await getParameter("notification-banner");
      expect(result).to.be.undefined;
    });

    it("should return parsed data from SSM when NODE_ENV is not local", async () => {
      process.env.NODE_ENV = "production";
      sendStub.resolves({
        Parameter: {
          Value: JSON.stringify({
            pageId: "/some-page",
            bannerMessage: "Test banner",
            bannerMessageCy: "Welsh Test banner",
            startTime: Date.now(),
            endTime: Date.now() + 1000 * 60 * 60 * 24,
          }),
        },
      });

      const result = await getParameter("notification-banner");

      expect(result).to.deep.include({
        pageId: "/some-page",
        bannerMessage: "Test banner",
        bannerMessageCy: "Welsh Test banner",
      });
      expect(result?.startTime).to.be.a("number");
      expect(result?.endTime).to.be.a("number");
    });

    it("should call the SSM client with the correct name", async () => {
      process.env.NODE_ENV = "production";
      sendStub.resolves({
        Parameter: {
          Value: JSON.stringify({
            pageId: "/some-page",
            bannerMessage: "Test banner",
            bannerMessageCy: "Welsh Test banner",
            startTime: Date.now(),
            endTime: Date.now() + 1000 * 60 * 60 * 24,
          }),
        },
      });

      await getParameter("notification-banner");

      expect(ssmClientStub).to.have.been.calledOnceWithExactly(
        sinon.match.instanceOf(GetParameterCommand),
      );
      expect(ssmClientStub.args[0][0].input.Name).to.equal(
        "notification-banner",
      );
    });
  });
});
