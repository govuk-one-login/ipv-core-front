import { expect } from "chai";
import PHONE_TYPES from "../../constants/phone-types";
import { detectAppTriageEvent, sniffPhoneType } from "./deviceSniffingHelper";
import EVENTS from "../../constants/events";
import {
  HTTP_HEADER_USER_AGENT_NO_PHONE,
  HTTP_HEADER_USER_AGENT_IPHONE,
  HTTP_HEADER_USER_AGENT_ANDROID,
} from "../../test-utils/constants";

describe("User Agent Functions", () => {
  describe("detectAppTriageEvent", () => {
    const testReq = {
      body: {
        journey: "appTriage",
      },
    };

    const testCases = [
      {
        userAgent: HTTP_HEADER_USER_AGENT_NO_PHONE,
        scenario: "unrecognised devices",
        expectedJourneyEvent: EVENTS.APP_TRIAGE,
      },
      {
        userAgent: HTTP_HEADER_USER_AGENT_IPHONE,
        scenario: "iOS devices",
        expectedJourneyEvent: EVENTS.APP_TRIAGE_IPHONE,
      },
      {
        userAgent: HTTP_HEADER_USER_AGENT_ANDROID,
        scenario: "Android devices",
        expectedJourneyEvent: EVENTS.APP_TRIAGE_ANDROID,
      },
    ];
    testCases.forEach(({ userAgent, scenario, expectedJourneyEvent }) => {
      it(`shuold return ${expectedJourneyEvent} for ${scenario}`, () => {
        const req = {
          ...testReq,
          headers: {
            "user-agent": userAgent,
          },
        } as any;
        const journeyEvent = detectAppTriageEvent(req);
        expect(journeyEvent).to.equal(expectedJourneyEvent);
      });
    });
  });

  describe("sniffPhoneType", () => {
    const testCases = [
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
    ];
    testCases.forEach(({ scenario, userAgent, expectedPhoneType }) => {
      it(`should return ${expectedPhoneType} for ${scenario}`, () => {
        const req = {
          headers: {
            "user-agent": userAgent,
          },
        } as any;
        const result = sniffPhoneType(req, "fallback");
        expect(result).to.equal(expectedPhoneType);
      });
    });
  });
});
