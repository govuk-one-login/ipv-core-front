export const parseQueryValue = (
  value: string | undefined,
): string | boolean | undefined => {
  if (value === "true" || value === "") return true;
  if (value === "false") return false;
  return value;
};
