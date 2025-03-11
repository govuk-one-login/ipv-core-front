import { generateHTMLofAddress } from "./addressHelper";
import { ProvenUserIdentityDetails } from "../../services/coreBackService";
import { i18n } from "i18next";
import { NamePartType } from "@govuk-one-login/data-vocab/credentials";

export interface UserDetails {
  name: string;
  dateOfBirth: string;
  nameParts: {
    givenName: string;
    familyName: string;
  };
  addresses?: {
    label: string;
    addressDetailHtml: string;
  }[];
}

export const samplePersistedUserDetails = {
  name: "Alessandro Cholmondeley-Featherstonehaugh",
  nameParts: [
    { type: "GivenName" as NamePartType, value: "Alessandro" },
    {
      type: "FamilyName" as NamePartType,
      value: "Cholmondeley-Featherstonehaugh",
    },
  ],
  dateOfBirth: "1984-02-29",
  addresses: [
    // all possible address parts
    // for explanations of each part
    // https://alliescomputing.com/knowledge-base/glossary-of-address-terms
    // https://docs.ideal-postcodes.co.uk/docs/data/paf
    {
      departmentName: "Room 25",
      organisationName: "Turing House",
      subBuildingName: "Block 4b",
      buildingName: "Vital Living",
      buildingNumber: "1",
      dependentStreetName: "Circular Square",
      streetName: "7 O'Reilly Way",
      doubleDependentAddressLocality: "Oxford Lane",
      dependentAddressLocality: "University Quarter",
      addressLocality: "Lancaster",
      addressRegion: "Lancashire",
      postalCode: "M12 7LU",
      addressCountry: "GB",
    },
    // example addresses
    {
      subBuildingName: "Flat 24",
      buildingName: "Wollatorn House",
      buildingNumber: "7",
      streetName: "Batchelor Street",
      addressLocality: "London",
      postalCode: "N15 0EY",
    },
    {
      subBuildingName: "Flat 18",
      buildingName: "The Paper Apartments",
      buildingNumber: "162",
      streetName: "Offord Road",
      addressLocality: "London",
      postalCode: "N2 1NS",
    },
    {
      buildingNumber: "7",
      streetName: "Acorne Terrace",
      addressLocality: "London",
      postalCode: "N16 4QF",
    },
  ],
};

export const generateUserDetails = (
  userDetailsResponse: ProvenUserIdentityDetails,
  i18n: i18n,
): UserDetails => {
  const givenName = userDetailsResponse.nameParts
    .filter((namePart) => namePart.type === "GivenName")
    .map((namePart) => namePart.value)
    .join(" ");
  const familyName = userDetailsResponse.nameParts
    .filter((namePart) => namePart.type === "FamilyName")
    .map((namePart) => namePart.value)
    .join(" ");
  return {
    name: userDetailsResponse.name,
    nameParts: {
      givenName,
      familyName,
    },
    dateOfBirth: userDetailsResponse.dateOfBirth,
    addresses: userDetailsResponse.addresses?.map((address, idx) => {
      const addressDetailHtml = generateHTMLofAddress(address);
      const label =
        idx === 0
          ? i18n.t(
              "pages.pageIpvReuse.content.userDetailsInformation.currentAddress",
            )
          : `${i18n.t(
              "pages.pageIpvReuse.content.userDetailsInformation.previousAddress",
            )} ${idx}`;

      return { label, addressDetailHtml };
    }),
  };
};
