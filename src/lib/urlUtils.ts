/**
 * @param hash location.hash
 * @returns path and query string if hash parameter is not empty
 */
export const parseHash = (hash: string) => {
  if (!hash || hash.length === 0) return '';

  // Remove '#' and split by '?'
  const [path, queryString] = hash.substring(1).split('?');

  // Reconstruct path and query string
  return `${path}${queryString ? `?${queryString}` : ''}`;
};
