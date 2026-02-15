import { APIRequestContext } from '@playwright/test';

const ASYNC_DCMAW_STUB_URL = process.env.ASYNC_DCMAW_STUB_URL || 'https://dcmaw-async.stubs.account.gov.uk';
const ASYNC_QUEUE_NAME = process.env.ASYNC_QUEUE_NAME || 'stubQueue_criResponseQueue_build';

export interface EnqueueVcResponse {
  oauthState: string;
}

export class DcmawAsyncService {
  constructor(private request: APIRequestContext) {}

  async enqueueVc(
    userId: string,
    testUser: string,
    documentType: string,
    evidenceType: string,
  ): Promise<string> {
    const payload = {
      user_id: userId,
      test_user: testUser,
      document_type: documentType,
      evidence_type: evidenceType,
      queue_name: ASYNC_QUEUE_NAME,
    };

    const response = await this.request.post(`${ASYNC_DCMAW_STUB_URL}/management/enqueueVc`, {
      data: payload,
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status() !== 201) {
      throw new Error(`DCMAW enqueue VC request failed: ${response.status()}`);
    }

    const body = await response.json();
    const oauthState = body.oauthState;

    if (typeof oauthState !== 'string') {
      throw new Error(`DCMAW enqueue VC request did not return a string oauthState: ${JSON.stringify(oauthState)}`);
    }

    return oauthState;
  }
}
