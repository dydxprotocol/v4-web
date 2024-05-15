export const isExternalLink = (href: string | undefined) => {
  if (href)
    try {
      return new URL(href).hostname !== globalThis.location.hostname;
    } catch {
      /* empty */
    }
  return false;
};
