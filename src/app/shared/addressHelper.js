// functions duplicated from address cri
module.exports = {
  generateHTMLofAddress: function (address) {
    const { buildingNames, streetNames, localityNames } =
      extractAddressFields(address);

    const fullBuildingName = buildingNames.join(" ");
    let fullStreetName;
    if (streetNames) {
      fullStreetName = streetNames.join(" ");
    }

    const fullLocality = localityNames.join(" ");

    if (fullStreetName) {
      return `${fullBuildingName}<br>${fullStreetName},<br>${fullLocality},<br>${address.postalCode}`;
    } else {
      return `${fullBuildingName},<br>${fullLocality},<br>${address.postalCode}`;
    }
  },
};

function extractAddressFields(address) {
  let buildingNames = [];
  let streetNames = [];
  let localityNames = [];

  // handle building name
  if (address.departmentName) {
    buildingNames.push(address.departmentName);
  }
  if (address.organisationName) {
    buildingNames.push(address.organisationName);
  }
  if (address.subBuildingName) {
    buildingNames.push(address.subBuildingName);
  }
  if (address.buildingName) {
    buildingNames.push(address.buildingName);
  }

  // street names
  if (address.buildingNumber) {
    streetNames.push(address.buildingNumber);
  }
  if (address.dependentStreetName) {
    streetNames.push(address.dependentStreetName);
  }
  if (address.streetName) {
    streetNames.push(address.streetName);
  }

  // locality names
  if (address.doubleDependentAddressLocality) {
    localityNames.push(address.doubleDependentAddressLocality);
  }
  if (address.dependentAddressLocality) {
    localityNames.push(address.dependentAddressLocality);
  }
  if (address.addressLocality) {
    localityNames.push(address.addressLocality);
  }
  return { buildingNames, streetNames, localityNames };
}
