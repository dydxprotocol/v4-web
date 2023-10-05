import { createContext, useContext, useEffect } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';

import { RestrictionType } from '@/constants/abacus';
import { DialogTypes } from '@/constants/dialogs';

import { getRestrictionType } from '@/state/accountSelectors';
import { forceOpenDialog } from '@/state/dialogs';

const useRestrictionContext = () => {
  const dispatch = useDispatch();
  const restrictionType = useSelector(getRestrictionType, shallowEqual);

  useEffect(() => {
    if (restrictionType === RestrictionType.GEO_RESTRICTED) {
      dispatch(
        forceOpenDialog({ type: DialogTypes.RestrictedGeo, dialogProps: { preventClose: true } })
      );
    }
  }, [restrictionType, dispatch]);

  return {
    isBadActor: restrictionType === RestrictionType.USER_RESTRICTED,
    isGeoRestricted: restrictionType === RestrictionType.GEO_RESTRICTED,
  };
};

type RestrictionContextType = ReturnType<typeof useRestrictionContext>;
const RestrictionContext = createContext<RestrictionContextType>({} as RestrictionContextType);
RestrictionContext.displayName = 'Restriction';

export const RestrictionProvider = ({ ...props }) => (
  <RestrictionContext.Provider value={useRestrictionContext()} {...props} />
);

export const useRestrictions = () => useContext(RestrictionContext);
