const camelCase = (input: string): string => {
    if (!input) {
      return "";
    }

    return input.replace(/-([a-zA-Z])/g, (g) => {
      return g.charAt(1).toUpperCase();
    });
  };

  const capitaliseFirstLetter = (input: string): string => {
    return input.charAt(0).toUpperCase() + input.slice(1);
  };

  // eg form-tracker to FormTracker
  export const kebabCaseToPascalCase = (input: string): string => {
    return capitaliseFirstLetter(camelCase(input));
  };
