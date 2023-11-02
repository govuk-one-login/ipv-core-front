const { expect } = require("chai");
const { generateHTMLofAddress } = require("./addressHelper");

describe("Address Helper", () => {
  context("generateHTMLofAddress", () => {
    it("should generate HTML with full street name", () => {
      const data = [
        {
          address: {
            organisationName: "My company",
            departmentName: "My department",
            buildingName: "my building",
            subBuildingName: "Room 5",
            buildingNumber: "1",
            dependentStreetName: "My outter street",
            streetName: "my inner street",
            doubleDependentAddressLocality: "My double dependant town",
            dependentAddressLocality: "my dependant town",
            addressLocality: "my town",
            postalCode: "myCode",
          },
          text: "My department, My company, Room 5, my building<br>1 My outter street my inner street<br>My double dependant town my dependant town my town<br>myCode",
        },
      ];

      data.forEach((addressData) => {
        const output = generateHTMLofAddress(addressData.address);
        expect(output).to.equal(addressData.text);
      });
    });

    it("should generate HTML without full street name", () => {
      const data = [
        {
          address: {
            organisationName: "My company",
            departmentName: "My department",
            buildingName: "my building",
            subBuildingName: "Room 5",
            buildingNumber: "",
            dependentStreetName: "",
            streetName: "",
            doubleDependentAddressLocality: "My double dependant town",
            dependentAddressLocality: "my dependant town",
            addressLocality: "my town",
            postalCode: "myCode",
          },
          text: "My department, My company, Room 5, my building<br>My double dependant town my dependant town my town<br>myCode",
        },
      ];

      data.forEach((addressData) => {
        const output = generateHTMLofAddress(addressData.address);
        expect(output).to.equal(addressData.text);
      });
    });
  });
});
