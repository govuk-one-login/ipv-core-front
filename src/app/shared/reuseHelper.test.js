const { expect } = require("chai");
const {
  samplePersistedUserDetails,
  generateUserDetails,
} = require("./reuseHelper");

describe("Sample Persisted User Details", () => {
  it("should have the expected structure", () => {
    expect(samplePersistedUserDetails).to.deep.equal({
      data: {
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
            postalCode: "M12 7LU",
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
        name: "Alessandro Cholmondeley-Featherstonehaugh",
      },
    });
  });
});

describe("Generate User Details", () => {
  it("should generate user details correctly", () => {
    const userDetailsResponse = samplePersistedUserDetails;

    const i18n = {
      t: (key) => key,
    };

    const userDetails = generateUserDetails(userDetailsResponse, i18n);

    expect(userDetails).to.deep.equal({
      name: "Alessandro Cholmondeley-Featherstonehaugh",
      dateOfBirth: "1984-02-29",
      addresses: [
        {
          label:
            "pages.pageIpvReuse.content.userDetailsInformation.currentAddress",
          addressDetailHtml:
            "Room 25, Turing House, Block 4b, Vital Living<br>1 Circular Square 7 O'Reilly Way<br>Oxford Lane University Quarter Lancaster<br>M12 7LU",
        },
        {
          label:
            "pages.pageIpvReuse.content.userDetailsInformation.previousAddress 1",
          addressDetailHtml:
            "Flat 24, Wollatorn House<br>7 Batchelor Street<br>London<br>N15 0EY",
        },
        {
          label:
            "pages.pageIpvReuse.content.userDetailsInformation.previousAddress 2",
          addressDetailHtml:
            "Flat 18, The Paper Apartments<br>162 Offord Road<br>London<br>N2 1NS",
        },
        {
          label:
            "pages.pageIpvReuse.content.userDetailsInformation.previousAddress 3",
          addressDetailHtml: "7 Acorne Terrace<br>London<br>N16 4QF",
        },
      ],
    });
  });
});
