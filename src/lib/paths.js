const path = require("path");

function getRoutePath(page) {
  return path.join("/", "page", page);
}

function getIpvPagePath(page) {
  return path.join("/", "ipv", "page", page);
}

function getIpvPageTemplatePath(page) {
  return path.join("ipv", "page", addNunjucksExt(page));
}

function addNunjucksExt(path) {
  return `${path}.njk`;
}

module.exports = {
  getRoutePath,
  getIpvPagePath,
  getIpvPageTemplatePath,
  addNunjucksExt,
};
