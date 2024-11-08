import { expect } from "chai";
import {
  ClientResponse,
  CriResponse,
  isValidClientResponse,
  isValidCriResponse,
} from "./postJourneyEventResponse";

describe("isValidCriResponse", () => {
  it("should throw if CRI response has empty redirectUrl", () => {
    // Arrange
    const response: any = {
      cri: {
        id: "someId",
        redirectUrl: undefined,
      },
    };

    // Act & Assert
    expect(() => isValidCriResponse(response)).to.throw(
      "CRI response RedirectUrl is missing",
    );
  });

  it("should return true if CRI response is valid", () => {
    // Arrange
    const response: CriResponse = {
      cri: {
        id: "someId",
        redirectUrl: "some-redirect-url",
      },
    };

    // Act & Assert
    expect(isValidCriResponse(response)).to.be.true;
  });
});

describe("isValidClientResponse", () => {
  it("should throw if Client response has empty redirectUrl", () => {
    // Arrange
    const response: any = {
      client: {
        redirectUrl: undefined,
      },
    };

    // Act & Assert
    expect(() => isValidClientResponse(response)).to.throw(
      "Client Response redirect url is missing",
    );
  });

  it("should return true if CRI response is valid", () => {
    // Arrange
    const response: ClientResponse = {
      client: {
        redirectUrl: "some-redirect-url",
      },
    };

    // Act & Assert
    expect(isValidClientResponse(response)).to.be.true;
  });
});
