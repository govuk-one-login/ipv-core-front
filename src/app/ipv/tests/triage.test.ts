import { expect } from "chai";
import BadRequestError from "../../../errors/bad-request-error";
import { getTriageAnswers, TRIAGE_PAGES } from "../triage";

describe("triage", () => {
  describe("TRIAGE_PAGES", () => {
    it("should include live-in-uk, whose answer is the journey radio button", () => {
      // Act
      const triagePage = TRIAGE_PAGES.get("live-in-uk");

      // Assert
      expect(triagePage).to.deep.equal({ answerField: "journey" });
    });

    it("should not include a page that is not a triage page", () => {
      // Act
      const triagePage = TRIAGE_PAGES.get("page-ipv-identity-document-start");

      // Assert
      expect(triagePage).to.be.undefined;
    });
  });

  describe("getTriageAnswers", () => {
    it("should wrap a single submitted value in an array", () => {
      // Arrange
      const body = { journey: "uk" };

      // Act
      const answers = getTriageAnswers(body, "journey");

      // Assert
      expect(answers).to.deep.equal(["uk"]);
    });

    it("should return an array of submitted values unchanged", () => {
      // Arrange
      const body = { documents: ["passport", "driving-licence"] };

      // Act
      const answers = getTriageAnswers(body, "documents");

      // Assert
      expect(answers).to.deep.equal(["passport", "driving-licence"]);
    });

    it("should only read the named answer field", () => {
      // Arrange
      const body = { _csrf: "token", journey: "international" };

      // Act
      const answers = getTriageAnswers(body, "journey");

      // Assert
      expect(answers).to.deep.equal(["international"]);
    });

    const invalidBodies: Array<{
      description: string;
      body: Record<string, unknown> | undefined;
    }> = [
      { description: "the body is missing", body: undefined },
      { description: "the answer field is missing", body: { other: "uk" } },
      { description: "the answer is a number", body: { journey: 1 } },
      { description: "the answer is an object", body: { journey: {} } },
      {
        description: "an array answer contains a non-string",
        body: { journey: ["uk", 1] },
      },
    ];

    invalidBodies.forEach(({ description, body }) => {
      it(`should throw BadRequestError when ${description}`, () => {
        // Act & Assert
        expect(() => getTriageAnswers(body, "journey")).to.throw(
          BadRequestError,
          "journey must be a string or array of strings",
        );
      });
    });
  });
});
