// eg form-tracker to FormTracker
const kebabCaseToPascalCase = function (string) {
  const camelCase = function (string) {
    if (!string) {
      return ""
    };
    
    return string.replace(/-([a-zA-Z])/g, function (g) {
      return g.charAt(1).toUpperCase();
    });
  };

  const capitaliseFirstLetter = function (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return capitaliseFirstLetter(camelCase(string));
};

module.exports = {
  kebabCaseToPascalCase,
};
