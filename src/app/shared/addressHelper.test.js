const { expect } = require("chai");
const { generateHTMLofAddress } = require("./addressHelper");

describe("Address Helper", () => {
  context("generateHTMLofAddress", () => {
    it("should generate HTML with street name", () => {
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
          text: "My company My department my building Room 5 1<br>My outter street my inner street,<br>My double dependant town my dependant town my town,<br>myCode<br>",
        },
      ];

      data.forEach((addressData, index) => {
        it(`should match test address ${index} to its expected text output`, () => {
          const output = generateHTMLofAddress(addressData.address);
          expect(output).to.equal(addressData.text);
        });
      });
    });

    it("should generate HTML without street name", () => {
      const data = [
        {
          address: {
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
          },
          text: "My company My deparment my building Room 5 1<br>My outter street my inner street,<br>My double dependant town my dependant town my town,<br>myCode<br>",
        },
      ];

      data.forEach((addressData, index) => {
        it(`should match test address ${index} to its expected text output`, () => {
          const output = generateHTMLofAddress(addressData.address);
          expect(output).to.equal(addressData.text);
        });
      });
    });
  });
});
