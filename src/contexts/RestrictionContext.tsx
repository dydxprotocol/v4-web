import { createContext, useEffect, type ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { RestrictionType } from '@/constants/abacus';
import { DialogTypes } from '@/constants/dialogs';

import { GeoPage } from '@/pages/Geo';

import { calculateIsGeoRestricted } from '@/state/accountCalculators';
import { getRestrictionType } from '@/state/accountSelectors';
import { openDialog } from '@/state/dialogs';

const useRestriction = () => {
  const dispatch = useDispatch();
  const isGeoRestricted = useSelector(calculateIsGeoRestricted);
  const restrictionType = useSelector(getRestrictionType);

  useEffect(() => {
    if (restrictionType === RestrictionType.USER_RESTRICTED) {
      dispatch(openDialog({ type: DialogTypes.Unauthorized }));
    } else if (restrictionType === RestrictionType.USER_RESTRICTION_UNKNOWN) {
      dispatch(openDialog({ type: DialogTypes.RateLimit }));
    }
  }, [restrictionType, dispatch]);

  return isGeoRestricted;
};

const RestrictionContext = createContext<ReturnType<typeof useRestriction> | undefined>(false);
RestrictionContext.displayName = 'Restriction';

export const RestrictionProvider = ({ children }: { children?: ReactNode }) => {
  return (
    <RestrictionContext.Provider value={useRestriction()}>
      <RestrictionContext.Consumer>
        {(isRestricted) => {
          return isRestricted ? <GeoPage /> : children;
        }}
      </RestrictionContext.Consumer>
    </RestrictionContext.Provider>
  );
};
