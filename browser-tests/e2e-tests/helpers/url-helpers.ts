export const sanitiseUrl = (url: string): string => {
  const parsedUrl = new URL(url);
  parsedUrl.password = "";
  parsedUrl.username = "";
  return parsedUrl.toString();
};
