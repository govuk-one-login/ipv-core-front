import { nameParts } from "../cri-stub-data-builders";
import {
  BirthDateClass,
  IdentityCheckSubjectClass,
  PassportDetailsClass,
} from "@govuk-one-login/data-vocab/credentials";

const kennethDecerquieraName = nameParts(["Kenneth"], "Decerqueira");

const kennethDecerqueiraBirthDate: BirthDateClass = { value: "1965-07-08" };

const kennethDecerquieraUkPassport: PassportDetailsClass = {
  documentNumber: "321654987",
  expiryDate: "2030-01-01",
  icaoIssuerCode: "GBR",
};

export const kennethDecerquieraPassport = (): IdentityCheckSubjectClass => ({
  name: [kennethDecerquieraName],
  birthDate: [kennethDecerqueiraBirthDate],
  passport: [kennethDecerquieraUkPassport],
});
