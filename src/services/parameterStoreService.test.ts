import { expect } from "chai";
import sinon from "sinon";
import {
  SSMClient,
  GetParameterCommand,
  GetParametersByPathCommand,
} from "@aws-sdk/client-ssm";
import { getParameter, getParametersByPath } from "./parameterStoreService";

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

    it("should return undefined when the parameter has no value", async () => {
      // Arrange
      sendStub.resolves({ Parameter: { Value: undefined } });

      // Act
      const result = await getParameter("/core-front/test-parameter");

      // Assert
      expect(result).to.be.undefined;
    });

    it("should reject when the parameter does not exist", async () => {
      // Arrange - SSM throws ParameterNotFound for a name that does not exist
      const notFoundError = new Error("Parameter not found");
      notFoundError.name = "ParameterNotFound";
      sendStub.rejects(notFoundError);

      // Act & Assert
      await expect(
        getParameter("/core-front/missing-parameter"),
      ).to.be.rejectedWith(notFoundError);
    });

    it("should return parsed data from SSM", async () => {
      // Arrange
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

      // Act
      const result = await getParameter("/core-front/test-parameter");

      // Assert
      const param = result && JSON.parse(result)[0];
      expect(param).to.deep.include({
        pageId: "/some-page",
        bannerMessage: "Test banner",
        bannerMessageCy: "Welsh Test banner",
      });

      expect(ssmClientStub).to.have.been.calledOnceWithExactly(
        sinon.match.instanceOf(GetParameterCommand),
      );
    });

    it("should return value from cache", async () => {
      // Act
      const result = await getParameter("/core-front/test-parameter");

      // Assert
      const param = result && JSON.parse(result)[0];
      expect(param).to.deep.include({
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

    it("should re-fetch from SSM once the cache entry has expired", async () => {
      // Arrange
      const clock = sinon.useFakeTimers();
      const sixMinutes = 1000 * 60 * 6; // comfortably past the 5-min cache TTL
      sendStub.resolves({ Parameter: { Value: "first-value" } });

      // Act - first call populates the cache
      const firstResult = await getParameter("/core-front/expiring-parameter");

      // Advance past the cache TTL so the entry is stale
      clock.tick(sixMinutes);
      sendStub.resolves({ Parameter: { Value: "second-value" } });
      const secondResult = await getParameter("/core-front/expiring-parameter");

      // Assert - the second call ignored the stale cache and hit SSM again
      expect(firstResult).to.equal("first-value");
      expect(secondResult).to.equal("second-value");
      expect(sendStub).to.have.been.calledTwice;
    });
  });

  describe("getParametersByPath", () => {
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

    it("should return a name/value map for all parameters under the path", async () => {
      // Arrange
      sendStub.resolves({
        Parameters: [
          { Name: "/core-front/test-parameter/1", Value: "first-value" },
          { Name: "/core-front/test-parameter/2", Value: "second-value" },
        ],
      });

      // Act
      const result = await getParametersByPath("/core-front/test-path");

      // Assert
      expect(result).to.deep.equal({
        "/core-front/test-parameter/1": "first-value",
        "/core-front/test-parameter/2": "second-value",
      });
      expect(ssmClientStub).to.have.been.calledOnceWithExactly(
        sinon.match.instanceOf(GetParametersByPathCommand),
      );
    });

    it("should return an empty map when no parameters exist under the path", async () => {
      // Arrange
      sendStub.resolves({ Parameters: [] });

      // Act
      const result = await getParametersByPath("/core-front/test-path-empty");

      // Assert
      expect(result).to.deep.equal({});
    });

    it("should follow pagination tokens and merge all pages", async () => {
      // Arrange
      sendStub.onFirstCall().resolves({
        Parameters: [
          { Name: "/core-front/test-parameter/1", Value: "first-value" },
        ],
        NextToken: "token-1",
      });
      sendStub.onSecondCall().resolves({
        Parameters: [
          { Name: "/core-front/test-parameter/2", Value: "second-value" },
        ],
      });

      // Act
      const result = await getParametersByPath("/core-front/test-path-paged");

      // Assert
      expect(result).to.deep.equal({
        "/core-front/test-parameter/1": "first-value",
        "/core-front/test-parameter/2": "second-value",
      });
      expect(sendStub).to.have.been.calledTwice;
    });

    it("should return value from cache without calling SSM again", async () => {
      // Arrange
      sendStub.resolves({
        Parameters: [
          { Name: "/core-front/test-parameter/1", Value: "first-value" },
        ],
      });
      await getParametersByPath("/core-front/test-path-cached");
      sendStub.resetHistory();

      // Act
      const result = await getParametersByPath("/core-front/test-path-cached");

      // Assert
      expect(result).to.deep.equal({
        "/core-front/test-parameter/1": "first-value",
      });
      expect(sendStub).to.not.have.been.called;
    });

    it("should re-fetch from SSM once the cache entry has expired", async () => {
      // Arrange
      const clock = sinon.useFakeTimers();
      const sixMinutes = 1000 * 60 * 6; // comfortably past the 5-min cache TTL
      sendStub.resolves({
        Parameters: [
          { Name: "/core-front/test-parameter/1", Value: "first-value" },
        ],
      });

      // Act - first call populates the cache
      const firstResult = await getParametersByPath(
        "/core-front/test-path-expiring",
      );

      // Advance past the cache TTL so the entry is stale
      clock.tick(sixMinutes);
      sendStub.resolves({
        Parameters: [
          { Name: "/core-front/test-parameter/1", Value: "second-value" },
        ],
      });
      const secondResult = await getParametersByPath(
        "/core-front/test-path-expiring",
      );

      // Assert - the second call ignored the stale cache and hit SSM again
      expect(firstResult).to.deep.equal({
        "/core-front/test-parameter/1": "first-value",
      });
      expect(secondResult).to.deep.equal({
        "/core-front/test-parameter/1": "second-value",
      });
      expect(sendStub).to.have.been.calledTwice;
    });
  });
});
