export interface TicfApiPayload {
  evidence: {
    type: string;
    txn: string;
    ci: null;
  };
  responseDelay: number;
}

export interface EvidenceScores {
  strength?: string;
  validity?: string;
  activityHistory?: string;
  biometricVerification?: string;
  fraud?: string;
}
