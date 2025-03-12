import { expect } from "chai";
import { generateHTMLofAddress } from "./addressHelper";

describe("Address Helper", () => {
  context("generateHTMLofAddress", () => {
    it("should generate HTML with full street name", () => {
      // Arrange
      const address = {
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
        addressRegion: "myRegion",
      };

      // Act
      const output = generateHTMLofAddress(address);

      // Assert
      expect(output).to.equal(
        "My department, My company, Room 5, my building<br>1, My outter street, my inner street<br>My double dependant town, my dependant town, my town<br>myRegion<br>myCode",
      );
    });

    it("should generate HTML without full street name", () => {
      // Arrange
      const address = {
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
        addressRegion: "myRegion",
      };

      // Act
      const output = generateHTMLofAddress(address);

      // Assert
      expect(output).to.equal(
        "My department, My company, Room 5, my building<br>My double dependant town, my dependant town, my town<br>myRegion<br>myCode",
      );
    });
  });
});
