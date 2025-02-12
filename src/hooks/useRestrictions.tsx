import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const useRestrictionContext = () => {
  const [sanctionedAddresses, setSanctionedAddresses] = useState<string[]>([]);

  const updateSanctionedAddresses = useCallback(
    (screenedAddresses: { [address: string]: boolean }) => {
      const toAdd = Object.entries(screenedAddresses)
        .filter(([, isSanctioned]) => isSanctioned)
        .map(([address]) => address);

      if (toAdd.length) {
        setSanctionedAddresses([...sanctionedAddresses, ...toAdd]);
      }
    },
    [sanctionedAddresses]
  );

  return {
    updateSanctionedAddresses,
    sanctionedAddresses: useMemo(() => new Set(sanctionedAddresses), [sanctionedAddresses]),
  };
};

type RestrictionContextType = ReturnType<typeof useRestrictionContext>;
const RestrictionContext = createContext<RestrictionContextType>({} as RestrictionContextType);
RestrictionContext.displayName = 'Restriction';

export const RestrictionProvider = ({ ...props }) => (
  <RestrictionContext.Provider value={useRestrictionContext()} {...props} />
);

export const useRestrictions = () => useContext(RestrictionContext);
