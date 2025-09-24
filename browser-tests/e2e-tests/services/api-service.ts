import { APIRequestContext } from '@playwright/test';
import { randomUUID } from 'crypto';
import { CONFIG } from '../config/test-config';
import { TicfApiPayload } from '../types/test-data';

export class ApiService {
  constructor(private request: APIRequestContext) {}

  async configureTicfManagementApi(userId: string): Promise<void> {
    const payload: TicfApiPayload = {
      evidence: {
        type: "RiskAssessment",
        txn: randomUUID(),
        ci: null,
      },
      responseDelay: 0,
    };

    const response = await this.request.post(`${CONFIG.URLS.TICF_MANAGEMENT_API}/${userId}`, {
      headers: {
        'x-api-key': CONFIG.API.TICF_API_KEY,
        'Content-Type': 'application/json',
      },
      data: payload,
    });

    if (!response.ok()) {
      throw new Error(`TICF API call failed with status ${response.status()}`);
    }

    const responseBody = await response.json();
    if (responseBody.message !== 'Success!!') {
      throw new Error(`Unexpected API response: ${responseBody.message}`);
    }
  }
}
