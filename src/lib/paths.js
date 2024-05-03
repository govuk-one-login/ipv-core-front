const path = require("path");

function getIpvPagePath(pageId) {
  return `/ipv/page/${encodeURIComponent(pageId)}`;
}

function getIpvPageTemplatePath(pageId) {
  return getTemplatePath("ipv", "page", pageId);
}

function getTemplatePath(...pathComponents) {
  const pageId = pathComponents.splice(-1, 1);
  return path.join(...pathComponents, `${pageId}.njk`);
}

module.exports = {
  getIpvPagePath,
  getIpvPageTemplatePath,
  getTemplatePath,
};
