// functions duplicated from address CRI
// updated Jul 2023 to remove blank lines in content

import { PostalAddressClass } from "@govuk-one-login/data-vocab/credentials";

const extractAddressFields = (
  address: PostalAddressClass,
): {
  buildingNames: string[];
  streetNames: string[];
  localityNames: string[];
} => {
  const buildingNames = [];
  const streetNames = [];
  const localityNames = [];

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
};

export const generateHTMLofAddress = (address: PostalAddressClass): string => {
  const { buildingNames, streetNames, localityNames } =
    extractAddressFields(address);

  const fullBuildingName = buildingNames.join(", ");
  let fullStreetName;
  if (streetNames.length > 0) {
    fullStreetName = streetNames.join(", ");
  }

  const fullLocality = localityNames.join(", ");

  let html = "";
  if (fullBuildingName) html += `${fullBuildingName}<br>`;
  if (fullStreetName) html += `${fullStreetName}<br>`;
  if (fullLocality) html += `${fullLocality}<br>`;
  if (address.addressRegion) html += `${address.addressRegion}<br>`;
  html += `${address.postalCode}`;

  return html;
};
