export const SUPPORTED_COMBO_EVENTS = Object.freeze({
  UPDATE_ADDRESS: "address-only",
  UPDATE_GIVEN_NAMES: "given-names-only",
  UPDATE_FAMILY_NAME: "family-name-only",
  UPDATE_GIVEN_NAMES_ADDRESS: "given-names-and-address",
  UPDATE_FAMILY_NAME_ADDRESS: "family-name-and-address",
  UPDATE_CANCEL: "cancel",
});

export const UNSUPPORTED_COMBO_EVENTS = Object.freeze({
  address: "address",
  givenNames: "given",
  familyName: "family",
  dateOfBirth: "dob",
});

export type UpdateDetailsOptions =
  | "address"
  | "givenNames"
  | "familyName"
  | "dateOfBirth";

export type UpdateDetailsOptionsWithCancel = "cancel" | UpdateDetailsOptions;
