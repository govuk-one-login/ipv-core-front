export function generateAxiosConfig (req: any) {
  return {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "ipv-session-id": req.session?.ipvSessionId,
      "x-request-id": req.id,
      "ip-address": req.session.ipAddress,
      "feature-set": req.session.featureSet,
    },
  };
}
export function generateAxiosConfigWithClientSessionId (req: any) {
  return {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "ipv-session-id": req.session?.ipvSessionId,
      "client-session-id": req?.session?.clientOauthSessionId,
      "x-request-id": req.id,
      "ip-address": req.session.ipAddress,
      "feature-set": req.session.featureSet,
    },
  };
}
export function generateJsonAxiosConfig (req: any) {
  return {
    headers: {
      "Content-Type": "application/json",
      "ipv-session-id": req.session?.ipvSessionId,
      "x-request-id": req.id,
      "ip-address": req.session.ipAddress,
      "feature-set": req.session.featureSet,
    },
  };
};
