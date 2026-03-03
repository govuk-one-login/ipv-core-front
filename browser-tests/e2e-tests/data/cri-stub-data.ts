export interface EvidenceScores {
  strength?: string;
  validity?: string;
  activityHistory?: string;
  verification?: string;
  fraud?: string;
}

export interface CriStubDataConfig {
  stubData: string;
  evidenceScores?: EvidenceScores;
  overrideVcNbf?: boolean;
  sendVcToAsyncQueue?: boolean;
}

export const criStubData: Record<string, Record<string, CriStubDataConfig>> = {
  "alice-parker-valid": {
    "driving-licence": {
      stubData: "Alice Parker (Valid) DVLA Licence",
      evidenceScores: { strength: "3", validity: "2", activityHistory: "1" },
    },
    address: {
      stubData: "Alice Parker Valid Address",
    },
  },
  "alice-parker-expired-fraud": {
    fraud: {
      stubData: "Alice Parker (Valid) Fraud",
      evidenceScores: { fraud: "2", activityHistory: "1" },
      overrideVcNbf: true,
    },
  },
  "alice-parker-changed-first-name": {
    "driving-licence": {
      stubData: "Alice Parker (Changed First Name) DVLA Licence",
      evidenceScores: { strength: "3", validity: "2", activityHistory: "1" },
    },
    fraud: {
      stubData: "Alice Parker (Changed First Name) Fraud",
      evidenceScores: { fraud: "2", activityHistory: "1" },
    },
  },
  "kenneth-decerqueira-valid": {
    passport: {
      stubData: "Kenneth Decerqueira (Valid Experian) Passport",
      evidenceScores: { strength: "3", validity: "2" },
    },
    address: {
      stubData: "Kenneth Decerqueira (Valid Experian) Address",
    },
    fraud: {
      stubData: "Kenneth Decerqueira (Valid Experian) Fraud",
      evidenceScores: { fraud: "2", activityHistory: "1" },
    },
    "experian-kbv": {
      stubData: "Kenneth Decerqueira (Valid Experian) KBV",
      evidenceScores: { verification: "2" },
    },
    "claimed-identity": {
      stubData: "Kenneth Decerqueira",
    },
    f2f: {
      stubData: "Kenneth Decerqueira (Valid Passport)",
      evidenceScores: {
        strength: "4",
        validity: "2",
        verification: "3",
      },
      sendVcToAsyncQueue: true,
    },
  },
};
