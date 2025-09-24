export interface TicfApiPayload {
  evidence: {
    type: string;
    txn: string;
    ci: null;
  };
  responseDelay: number;
}

export interface EvidenceScores {
  strengthHours?: string;
  validityMinutes?: string;
  activityHistorySeconds?: string;
  biometricVerification?: string;
  fraud?: string;
  activity?: string;
}