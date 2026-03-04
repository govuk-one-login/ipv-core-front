import {
  DrivingPermitDetailsClass,
  NameClass,
  NamePartClass,
} from "@govuk-one-login/data-vocab/credentials";

export const nameParts = (
  givenNames: string[],
  familyName: string,
): NameClass => {
  const mappedGivenNames: NamePartClass[] = givenNames.map((value) => ({
    type: "GivenName",
    value,
  }));
  return {
    nameParts: [...mappedGivenNames, { type: "FamilyName", value: familyName }],
  };
};

export const drivingPermit = (
  personalNumber: string,
  issuedBy: string,
  overrides?: Partial<DrivingPermitDetailsClass>,
): DrivingPermitDetailsClass => {
  const expDate = new Date();
  expDate.setMonth(expDate.getFullYear() + 1);
  return {
    expiryDate: expDate.toISOString().split("T")[0],
    issuedBy,
    personalNumber,
    issueNumber: "23",
    issueDate: "2005-02-02",
    ...overrides,
  };
};
