import { expect } from "chai";
import { samplePersistedUserDetails, generateUserDetails } from "./reuseHelper";
import { i18n } from "i18next";
import { NamePartType } from "@govuk-one-login/data-vocab/credentials";

describe("Sample Persisted User Details", () => {
  it("should have the expected structure", () => {
    expect(samplePersistedUserDetails).to.deep.equal({
      addresses: [
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
          addressCountry: "IT",
        },
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
      dateOfBirth: "1984-02-29",
      nameParts: [
        { type: "GivenName", value: "Alessandro" },
        { type: "FamilyName", value: "Cholmondeley-Featherstonehaugh" },
      ],
      name: "Alessandro Cholmondeley-Featherstonehaugh",
    });
  });
});

describe("Generate User Details", () => {
  const mockI18n = {
    t: (key) => key,
  } as i18n;

  it("should generate user details correctly", () => {
    // Arrange
    const userDetailsResponse = samplePersistedUserDetails;

    // Act
    const userDetails = generateUserDetails(userDetailsResponse, mockI18n);

    // Assert
    expect(userDetails).to.deep.equal({
      name: "Alessandro Cholmondeley-Featherstonehaugh",
      nameParts: {
        givenName: "Alessandro",
        familyName: "Cholmondeley-Featherstonehaugh",
      },
      dateOfBirth: "1984-02-29",
      addresses: [
        {
          label:
            "pages.pageIpvReuse.content.userDetailsInformation.currentAddress",
          addressDetailHtml:
            "Room 25, Turing House, Block 4b, Vital Living<br>1, Circular Square, 7 O'Reilly Way<br>Oxford Lane, University Quarter, Lancaster<br>Lancashire<br>M12 7LU<br>Italy",
        },
        {
          label:
            "pages.pageIpvReuse.content.userDetailsInformation.previousAddress 1",
          addressDetailHtml:
            "Flat 24, Wollatorn House<br>7, Batchelor Street<br>London<br>N15 0EY",
        },
        {
          label:
            "pages.pageIpvReuse.content.userDetailsInformation.previousAddress 2",
          addressDetailHtml:
            "Flat 18, The Paper Apartments<br>162, Offord Road<br>London<br>N2 1NS",
        },
        {
          label:
            "pages.pageIpvReuse.content.userDetailsInformation.previousAddress 3",
          addressDetailHtml: "7, Acorne Terrace<br>London<br>N16 4QF",
        },
      ],
    });
  });

  [
    {
      scenario: "single given name",
      nameAxiosResponse: {
        name: "firstName LastName",
        nameParts: [
          { type: "GivenName" as NamePartType, value: "firstName" },
          { type: "FamilyName" as NamePartType, value: "LastName" },
        ],
      },
      expectedNameUserDetails: {
        name: "firstName LastName",
        nameParts: {
          givenName: "firstName",
          familyName: "LastName",
        },
      },
    },
    {
      scenario: "multiple given name",
      nameAxiosResponse: {
        name: "firstName MiddleName LastName",
        nameParts: [
          { type: "GivenName" as NamePartType, value: "firstName" },
          { type: "GivenName" as NamePartType, value: "MiddleName" },
          { type: "FamilyName" as NamePartType, value: "LastName" },
        ],
      },
      expectedNameUserDetails: {
        name: "firstName MiddleName LastName",
        nameParts: {
          givenName: "firstName MiddleName",
          familyName: "LastName",
        },
      },
    },
  ].forEach(({ scenario, nameAxiosResponse, expectedNameUserDetails }) => {
    it(`should return the correct structured user details given ${scenario}`, async () => {
      // Arrange
      const provenUserIdentity = {
        dateOfBirth: "01 11 1973",
        addresses: [
          {
            organisationName: "My company",
            departmentName: "My deparment",
            buildingName: "my building",
            subBuildingName: "Room 5",
            buildingNumber: "1",
            dependentStreetName: "My outter street",
            streetName: "my inner street",
            doubleDependentAddressLocality: "My double dependant town",
            dependentAddressLocality: "my dependant town",
            addressLocality: "my town",
            postalCode: "myCode",
            addressRegion: "myRegion",
            addressCountry: "IT",
          },
        ],
        ...nameAxiosResponse,
      };

      // Act
      const res = generateUserDetails(provenUserIdentity, mockI18n);

      // Assert
      expect(res).to.deep.equal({
        dateOfBirth: "01 11 1973",
        addresses: [
          {
            label:
              "pages.pageIpvReuse.content.userDetailsInformation.currentAddress",
            addressDetailHtml:
              "My deparment, My company, Room 5, my building<br>1, My outter street, my inner street<br>My double dependant town, my dependant town, my town<br>myRegion<br>myCode<br>Italy",
          },
        ],
        ...expectedNameUserDetails,
      });
    });
  });
});
