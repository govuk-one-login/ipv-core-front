import { expect } from "chai";
import {
  ClientResponse,
  CriResponse,
  isValidClientResponse,
  isValidCriResponse,
} from "./postJourneyEventResponse";

describe("isValidCriResponse", () => {
  it("should throw if CRI response has empty redirectUrl", () => {
    const response = {
      cri: {
        id: "someId",
        redirectUrl: undefined,
      },
    } as any;

    expect(() => isValidCriResponse(response)).to.throw(
      "CRI response RedirectUrl is missing",
    );
  });

  it("should return true if CRI response is valid", () => {
    const response: CriResponse = {
      cri: {
        id: "someId",
        redirectUrl: "some-redirect-url",
      },
    };

    expect(isValidCriResponse(response)).to.be.true;
  });
});

describe("isValidClientResponse", () => {
  it("should throw if Client response has empty redirectUrl", () => {
    const response = {
      client: {
        redirectUrl: undefined,
      },
    } as any;

    expect(() => isValidClientResponse(response)).to.throw(
      "Client Response redirect url is missing",
    );
  });

  it("should return true if CRI response is valid", () => {
    const response: ClientResponse = {
      client: {
        redirectUrl: "some-redirect-url",
      },
    };

    expect(isValidClientResponse(response)).to.be.true;
  });
});
