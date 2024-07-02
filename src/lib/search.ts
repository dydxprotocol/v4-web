export const matchesSearchFilter = (search: string, other: string | null | undefined) => {
  return !!other?.toLocaleLowerCase().includes(search.trim().toLowerCase());
};
