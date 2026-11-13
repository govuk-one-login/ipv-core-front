/**
 * Client for the AIS (Account Intervention Service) management stub API.
 *
 * POSTs an intervention type to the AIS management endpoint keyed on the userId:
 *   POST {AIS_MANAGEMENT_URL}/{userId}
 *   Body: { "intervention": "<AIS_INTERVENTION_TYPE>" }
 */

import config from "../config";

/**
 * Configures the AIS stub to return the given intervention type for the specified user.
 *
 * @param userId       - The user ID captured from the orchestrator stub at journey start.
 * @param intervention - e.g. 'AIS_NO_INTERVENTION', 'AIS_ACCOUNT_SUSPENDED',
 *                       'AIS_FORCED_USER_IDENTITY_VERIFY', etc.
 * @throws if the AIS stub returns a non-200 status or a non-"Success" message.
 */
export const configureAisIntervention = async (
  userId: string,
  intervention: string,
): Promise<void> => {
  const url = `${config.aisManagementUrl}${userId}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ intervention }),
  });

  if (!response.ok) {
    throw new Error(
      `AIS management API returned ${response.status} for intervention '${intervention}' on user '${userId}'`,
    );
  }

  const body = (await response.json()) as { message?: string };
  if (body.message !== "Success") {
    throw new Error(
      `AIS management API returned unexpected message '${body.message}' for intervention '${intervention}'`,
    );
  }
};
