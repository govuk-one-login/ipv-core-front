import config from "../config";
import { criStubData, EvidenceScores } from "../data/cri-stub-data";
import {
  CheckMethodType,
  IdentityCheckClass,
} from "@govuk-one-login/data-vocab/credentials";

const createDcmawEvidenceBlock = (
  scores: EvidenceScores,
  successfulOrFailed: "successful" | "failed",
): IdentityCheckClass => {
  if (
    scores.verification == undefined &&
    scores.strength == undefined &&
    scores.verification == undefined &&
    scores.activityHistory == undefined
  ) {
    throw new Error(
      "Failed to create evidence block for DCMAW Async VC: missing scores.",
    );
  }

  const checkDetails = [
    {
      checkMethod: "vri" as CheckMethodType,
    },
    {
      checkMethod: "bvr" as CheckMethodType,
      biometricVerificationProcessLevel: scores.verification,
    },
  ];

  return {
    type: "IdentityCheck",
    strengthScore: scores.strength,
    validityScore: scores.validity,
    activityHistoryScore: scores.activityHistory,
    ...(successfulOrFailed === "successful"
      ? { checkDetails }
      : { failedCheckDetails: checkDetails }),
  };
};

export const enqueueVcWithScenario = async (
  userId: string,
  scenario: string,
  successfulOrFailed: "successful" | "failed",
): Promise<string> => {
  const scenarioData = criStubData[scenario]["dcmaw-async"];
  if (!scenarioData?.customCredentialSubject || !scenarioData?.evidenceScores) {
    throw new Error(
      `Missing credential subject and/or evidence for '${scenario}'`,
    );
  }
  const payload = {
    user_id: userId,
    credential_subject: scenarioData.customCredentialSubject,
    evidence: createDcmawEvidenceBlock(
      scenarioData.evidenceScores,
      successfulOrFailed,
    ),
    queue_name: config.asyncQueueName,
  };

  return postToEnqueueVc(payload);
};

export const enqueueVc = async (
  userId: string,
  testUser: string,
  documentType: string,
  evidenceType: string,
): Promise<string> => {
  const payload = {
    user_id: userId,
    test_user: testUser,
    document_type: documentType,
    evidence_type: evidenceType,
    queue_name: config.asyncQueueName,
  };

  return postToEnqueueVc(payload);
};

const postToEnqueueVc = async (payload: object): Promise<string> => {
  console.info("Enqueueing DCMAW Async VC...");

  const response = await fetch(`${config.dcmawAsyncUrl}/management/enqueueVc`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });

  const responsePayload = await response.json();
  if (response.status !== 201) {
    throw new Error(
      `DCMAW enqueue VC request failed: ${JSON.stringify(responsePayload)}`,
    );
  }

  const oauthState = responsePayload.oauthState;

  if (!oauthState || typeof oauthState !== "string") {
    throw new Error(
      `DCMAW enqueue VC request did not return an oauthState: ${JSON.stringify(oauthState)}`,
    );
  }

  return oauthState;
};
