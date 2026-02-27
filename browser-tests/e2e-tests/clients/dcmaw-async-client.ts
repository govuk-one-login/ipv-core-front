import fs from "fs";
import path from "path";

const ASYNC_DCMAW_STUB_URL =
  process.env.ASYNC_DCMAW_STUB_URL ||
  "https://dcmaw-async.stubs.account.gov.uk";
const ASYNC_QUEUE_NAME =
  process.env.ASYNC_QUEUE_NAME || "stubQueue_criResponseQueue_build";

export const enqueueVcWithScenario = async (
  userId: string,
  scenario: string,
) => {
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
    queue_name: ASYNC_QUEUE_NAME,
  };

  return postToEnqueueVc(payload);
};

export const enqueueVc = async (
  userId: string,
  testUser: string,
  documentType: string,
  evidenceType: string,
) => {
  const payload = {
    user_id: userId,
    test_user: testUser,
    document_type: documentType,
    evidence_type: evidenceType,
    queue_name: ASYNC_QUEUE_NAME,
  };

  return postToEnqueueVc(payload);
};

const postToEnqueueVc = async (payload: object) => {
  const response = await fetch(`${ASYNC_DCMAW_STUB_URL}/management/enqueueVc`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });

  const responsePayload = await response.json();
  if (response.status !== 201) {
    throw new Error(`DCMAW enqueue VC request failed: ${responsePayload}`);
  }

  const oauthState = responsePayload.oauthState;

  if (!oauthState || typeof oauthState !== "string") {
    throw new Error(
      `DCMAW enqueue VC request did not return an oauthState: ${JSON.stringify(oauthState)}`,
    );
  }

  return oauthState;
};
