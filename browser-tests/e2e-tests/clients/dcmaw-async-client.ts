import fs from "fs";
import path from "path";
import config from "../config";

export const enqueueVcWithScenario = async (
  userId: string,
  scenario: string,
): Promise<string> => {
  const payload = {
    user_id: userId,
    credential_subject: JSON.parse(
      fs.readFileSync(
        path.join(
          __dirname,
          `../data/async-dcmaw-stub-data/${scenario}/credentialSubject.json`,
        ),
        "utf-8",
      ),
    ),
    evidence: JSON.parse(
      fs.readFileSync(
        path.join(
          __dirname,
          `../data/async-dcmaw-stub-data/${scenario}/evidence.json`,
        ),
        "utf-8",
      ),
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
