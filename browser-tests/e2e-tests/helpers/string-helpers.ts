export const toCamelCase = (str: string): string =>
  str.replace(/\s+(\w)/g, (_, c) => c.toUpperCase());
