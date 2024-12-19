import path from "path";

export function getIpvPagePath(pageId: string): string {
  return `/ipv/page/${encodeURIComponent(pageId)}`;
}

export function getIpvPageTemplatePath(pageId: string): string {
  return getTemplatePath("ipv", "page", pageId);
}

export function getErrorPageTemplatePath(pageId: string): string {
  return getTemplatePath("errors", pageId);
}

export function getTemplatePath(...pathComponents: string[]): string {
  const pageId = pathComponents.splice(-1, 1);
  return path.join(...pathComponents, `${pageId}.njk`);
}

export function getHtmlPath(...pathComponents: string[]): string {
    const pageId = pathComponents.splice(-1, 1);
    return path.join(...pathComponents, `${pageId}.html`);
}
