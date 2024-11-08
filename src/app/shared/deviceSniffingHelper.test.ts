import { expect } from "chai";
import { PHONE_TYPES } from "../../constants/device-constants";
import { detectAppTriageEvent, sniffPhoneType } from "./deviceSniffingHelper";
import { APP_TRIAGE_EVENTS } from "../../constants/events";
import {
  HTTP_HEADER_USER_AGENT_NO_PHONE,
  HTTP_HEADER_USER_AGENT_IPHONE,
  HTTP_HEADER_USER_AGENT_ANDROID,
} from "../../test-utils/constants";
import { specifyCreateRequest } from "../../test-utils/mock-express";

describe("User Agent Functions", () => {
  describe("detectAppTriageEvent", () => {
    // Mock handler parameters
    const createRequest = specifyCreateRequest({
      body: {
        journey: "appTriage",
      },
    });

    [
      {
        userAgent: HTTP_HEADER_USER_AGENT_NO_PHONE,
        scenario: "unrecognised devices",
        expectedJourneyEvent: APP_TRIAGE_EVENTS.APP_TRIAGE,
      },
      {
        userAgent: HTTP_HEADER_USER_AGENT_IPHONE,
        scenario: "iOS devices",
        expectedJourneyEvent: APP_TRIAGE_EVENTS.APP_TRIAGE_IPHONE,
      },
      {
        userAgent: HTTP_HEADER_USER_AGENT_ANDROID,
        scenario: "Android devices",
        expectedJourneyEvent: APP_TRIAGE_EVENTS.APP_TRIAGE_ANDROID,
      },
    ].forEach(({ userAgent, scenario, expectedJourneyEvent }) => {
      it(`should return ${expectedJourneyEvent} for ${scenario}`, () => {
        // Arrange
        const req = createRequest({
          headers: {
            "user-agent": userAgent,
          },
        });

        // Act
        const journeyEvent = detectAppTriageEvent(req);

        // Assert
        expect(journeyEvent).to.equal(expectedJourneyEvent);
      });
    });
  });

  describe("sniffPhoneType", () => {
    const createRequest = specifyCreateRequest();

    [
      {
        scenario: "iOS user agents",
        userAgent: HTTP_HEADER_USER_AGENT_IPHONE,
        expectedPhoneType: PHONE_TYPES.IPHONE,
      },
      {
        scenario: "Android user agents",
        userAgent: HTTP_HEADER_USER_AGENT_ANDROID,
        expectedPhoneType: PHONE_TYPES.ANDROID,
      },
      {
        scenario: "OS not iOS or Android",
        userAgent: HTTP_HEADER_USER_AGENT_NO_PHONE,
        expectedPhoneType: "fallback",
      },
    ].forEach(({ scenario, userAgent, expectedPhoneType }) => {
      it(`should return ${expectedPhoneType} for ${scenario}`, () => {
        // Arrange
        const req = createRequest({
          headers: {
            "user-agent": userAgent,
          },
        });

        // Act
        const result = sniffPhoneType(req, "fallback");

        // Assert
        expect(result).to.equal(expectedPhoneType);
      });
    });
  });
});
