import { CredentialSubjectClass } from "@govuk-one-login/data-vocab/credentials";
import {
  aliceParkerDvla,
  alisonParkerDvla,
} from "./custom-credentials/alice-parker";
import { kennethDecerquieraPassport } from "./custom-credentials/kenneth-decerquiera";

export interface EvidenceScores {
  strength?: number;
  validity?: number;
  activityHistory?: number;
  verification?: number;
  fraud?: number;
}

export interface CriStubDataConfig {
  customCredentialSubject?: CredentialSubjectClass;
  cannedStubData?: string;
  evidenceScores?: EvidenceScores;
  overrideVcNbf?: boolean;
  sendVcToAsyncQueue?: boolean;
}

export const criStubData: Record<string, Record<string, CriStubDataConfig>> = {
  "alice-parker-valid": {
    "dcmaw-async": {
      customCredentialSubject: aliceParkerDvla(),
      evidenceScores: {
        strength: 3,
        validity: 2,
        activityHistory: 1,
        verification: 3,
      },
    },
    "driving-licence": {
      cannedStubData: "Alice Parker (Valid) DVLA Licence",
      evidenceScores: { strength: 3, validity: 2, activityHistory: 1 },
    },
    address: {
      cannedStubData: "Alice Parker Valid Address",
    },
  },
  "alice-parker-expired-fraud": {
    fraud: {
      cannedStubData: "Alice Parker (Valid) Fraud",
      evidenceScores: { fraud: 2, activityHistory: 1 },
      overrideVcNbf: true,
    },
  },
  "alice-parker-changed-first-name": {
    "dcmaw-async": {
      customCredentialSubject: alisonParkerDvla(),
      evidenceScores: {
        strength: 3,
        validity: 2,
        activityHistory: 1,
        verification: 3,
      },
    },
    "driving-licence": {
      cannedStubData: "Alice Parker (Changed First Name) DVLA Licence",
      evidenceScores: { strength: 3, validity: 2, activityHistory: 1 },
    },
    fraud: {
      cannedStubData: "Alice Parker (Changed First Name) Fraud",
      evidenceScores: { fraud: 2, activityHistory: 1 },
    },
  },
  "kenneth-decerqueira-valid": {
    "dcmaw-async": {
      customCredentialSubject: kennethDecerquieraPassport(),
      evidenceScores: {
        strength: 0,
        validity: 0,
        activityHistory: 0,
        verification: 0,
      },
    },
    passport: {
      cannedStubData: "Kenneth Decerqueira (Valid Experian) Passport",
      evidenceScores: { strength: 3, validity: 2 },
    },
    address: {
      cannedStubData: "Kenneth Decerqueira (Valid Experian) Address",
    },
    fraud: {
      cannedStubData: "Kenneth Decerqueira (Valid Experian) Fraud",
      evidenceScores: { fraud: 2, activityHistory: 1 },
    },
    "experian-kbv": {
      cannedStubData: "Kenneth Decerqueira (Valid Experian) KBV",
      evidenceScores: { verification: 2 },
    },
    "claimed-identity": {
      cannedStubData: "Kenneth Decerqueira",
    },
    f2f: {
      cannedStubData: "Kenneth Decerqueira (Valid Passport)",
      evidenceScores: {
        strength: 4,
        validity: 2,
        verification: 3,
      },
      sendVcToAsyncQueue: true,
    },
  },
};
