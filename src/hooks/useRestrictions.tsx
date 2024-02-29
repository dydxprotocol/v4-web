import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { shallowEqual, useDispatch, useSelector } from 'react-redux';

import { RestrictionType } from '@/constants/abacus';
import { DialogTypes } from '@/constants/dialogs';

import { getRestrictionType } from '@/state/accountSelectors';
import { forceOpenDialog } from '@/state/dialogs';

import { isTruthy } from '@/lib/isTruthy';

const useRestrictionContext = () => {
  const dispatch = useDispatch();
  const restrictionType = useSelector(getRestrictionType, shallowEqual);
  const [sanctionedAddresses, setSanctionedAddresses] = useState<string[]>([]);

  useEffect(() => {
    if (restrictionType === RestrictionType.GEO_RESTRICTED) {
      dispatch(
        forceOpenDialog({ type: DialogTypes.RestrictedGeo, dialogProps: { preventClose: true } })
      );
    }
  }, [restrictionType, dispatch]);

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
    isBadActor: restrictionType === RestrictionType.USER_RESTRICTED,
    isGeoRestricted: restrictionType === RestrictionType.GEO_RESTRICTED,
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
