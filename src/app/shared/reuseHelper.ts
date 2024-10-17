import { AxiosResponse } from "axios";
import { generateHTMLofAddress } from "./addressHelper";
import { ProvenUserIdentityDetails } from "../../services/coreBackService";
import { i18n } from "i18next";

export interface UserDetails {
  name: string;
  dateOfBirth: string;
  nameParts: {
    givenName: string;
    familyName: string;
  };
  addresses: {
    label: string;
    addressDetailHtml: string;
  }[];
}

export const samplePersistedUserDetails = {
  data: {
    name: "Alessandro Cholmondeley-Featherstonehaugh",
    nameParts: [
      { type: "GivenName", value: "Alessandro" },
      { type: "FamilyName", value: "Cholmondeley-Featherstonehaugh" },
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
        postalCode: "M12 7LU",
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
  },
} as AxiosResponse<ProvenUserIdentityDetails>;

export const generateUserDetails = (
  userDetailsResponse: AxiosResponse<ProvenUserIdentityDetails>,
  i18n: i18n,
): UserDetails => {
  const givenName = userDetailsResponse.data?.nameParts
    .filter((namePart) => namePart.type === "GivenName")
    .map((namePart) => namePart.value)
    .join(" ");
  const familyName = userDetailsResponse.data?.nameParts
    .filter((namePart) => namePart.type === "FamilyName")
    .map((namePart) => namePart.value)
    .join(" ");
  return {
    name: userDetailsResponse.data?.name,
    nameParts: {
      givenName,
      familyName,
    },
    dateOfBirth: userDetailsResponse.data?.dateOfBirth,
    addresses: userDetailsResponse.data?.addresses?.map((address, idx) => {
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
