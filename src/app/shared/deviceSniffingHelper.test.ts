import { expect } from "chai";
import { PHONE_TYPE } from "../../constants/device-constants";
import { detectAppTriageEvent, sniffPhoneType } from "./deviceSniffingHelper";
import { APP_TRIAGE_EVENTS } from "../../constants/events";
import {
  HTTP_HEADER_USER_AGENT_NO_PHONE,
  HTTP_HEADER_USER_AGENT_IPHONE_INVALID_VERSION,
  HTTP_HEADER_USER_AGENT_ANDROID,
  HTTP_HEADER_USER_AGENT_IPHONE_EXACT_VALID_VERSION,
  HTTP_HEADER_USER_AGENT_ANDROID_NO_VERSION,
  HTTP_HEADER_USER_AGENT_IPHONE_NO_VERSION,
  HTTP_HEADER_USER_AGENT_IPAD, HTTP_HEADER_USER_AGENT_IPHONE_VALID_VERSION
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
        userAgent: HTTP_HEADER_USER_AGENT_IPHONE_EXACT_VALID_VERSION,
        scenario: "iOS devices with exact valid version",
        expectedJourneyEvent: APP_TRIAGE_EVENTS.MOBILE_DOWNLOAD_IPHONE,
      },
      {
        userAgent: HTTP_HEADER_USER_AGENT_IPHONE_VALID_VERSION,
        scenario: "iOS devices with version greater than the minimum version supported",
        expectedJourneyEvent: APP_TRIAGE_EVENTS.MOBILE_DOWNLOAD_IPHONE,
      },
      {
        userAgent: HTTP_HEADER_USER_AGENT_IPHONE_INVALID_VERSION,
        scenario: "iOS devices with invalid version",
        expectedJourneyEvent: APP_TRIAGE_EVENTS.APP_TRIAGE_SMARTPHONE,
      },
      {
        userAgent: HTTP_HEADER_USER_AGENT_IPHONE_NO_VERSION,
        scenario: "iOS devices with no version",
        expectedJourneyEvent: APP_TRIAGE_EVENTS.APP_TRIAGE_SMARTPHONE,
      },
      {
        userAgent: HTTP_HEADER_USER_AGENT_ANDROID,
        scenario: "Android devices",
        expectedJourneyEvent: APP_TRIAGE_EVENTS.MOBILE_DOWNLOAD_ANDROID,
      },
      {
        userAgent: HTTP_HEADER_USER_AGENT_ANDROID_NO_VERSION,
        scenario: "Android devices with no version",
        expectedJourneyEvent: APP_TRIAGE_EVENTS.APP_TRIAGE_SMARTPHONE,
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
        userAgent: HTTP_HEADER_USER_AGENT_IPHONE_INVALID_VERSION,
        expectedOs: { name: PHONE_TYPE.IPHONE, version: 14.3 },
      },
      {
        scenario: "iOS user agents",
        userAgent: HTTP_HEADER_USER_AGENT_IPHONE_EXACT_VALID_VERSION,
        expectedOs: { name: PHONE_TYPE.IPHONE, version: 16.7 },
      },
      {
        scenario: "iOS user agents",
        userAgent: HTTP_HEADER_USER_AGENT_IPHONE_VALID_VERSION,
        expectedOs: { name: PHONE_TYPE.IPHONE, version: 17.1 },
      },
      {
        scenario: "Android user agents",
        userAgent: HTTP_HEADER_USER_AGENT_ANDROID,
        expectedOs: { name: PHONE_TYPE.ANDROID, version: 8 },
      },
      {
        scenario: "OS not iOS or Android",
        userAgent: HTTP_HEADER_USER_AGENT_NO_PHONE,
        expectedOs: { name: "fallback" },
      },
      {
        scenario: "iPad user agent",
        userAgent: HTTP_HEADER_USER_AGENT_IPAD,
        expectedOs: { name: "fallback" },
      },
    ].forEach(({ scenario, userAgent, expectedOs }) => {
      it(`should return ${expectedOs.name} and ${expectedOs.version} for ${scenario}`, () => {
        // Arrange
        const req = createRequest({
          headers: {
            "user-agent": userAgent,
          },
        });

        // Act
        const result = sniffPhoneType(req, { name: "fallback" });

        // Assert
        expect(result).to.deep.equal(expectedOs);
      });
    });
  });
});
