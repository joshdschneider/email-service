function getNextVersion(templates) {
  let versions = templates.map((t) => t.versionNumber);
  return Math.max(...versions) + 1;
}

function buildAlias(name, version) {
  return name.toLowerCase().replaceAll(' ', '-') + `-v${version.toString()}`;
}

module.exports = { buildAlias, getNextVersion };
