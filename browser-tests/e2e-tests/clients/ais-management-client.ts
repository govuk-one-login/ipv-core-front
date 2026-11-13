import config from "../config";

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
