import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { STRING_KEYS } from '@/constants/localization';
import type { NewMarketProposal } from '@/constants/potentialMarkets';

import { useStringGetter } from './useStringGetter';

const PotentialMarketsContext = createContext<ReturnType<typeof usePotentialMarketsContext>>({
  potentialMarkets: undefined,
  hasPotentialMarketsData: false,
  liquidityTiers: {
    0: {
      label: 'Large-cap',
      initialMarginFraction: 0.05,
      maintenanceMarginFraction: 0.03,
      impactNotional: 10_000,
    },
    1: {
      label: 'Mid-cap',
      initialMarginFraction: 0.1,
      maintenanceMarginFraction: 0.05,
      impactNotional: 5_000,
    },
    2: {
      label: 'Long-tail',
      initialMarginFraction: 0.2,
      maintenanceMarginFraction: 0.1,
      impactNotional: 2_500,
    },
    3: {
      label: 'Safety',
      initialMarginFraction: 1,
      maintenanceMarginFraction: 0.2,
      impactNotional: 2_500,
    },
  },
});

PotentialMarketsContext.displayName = 'PotentialMarkets';

export const PotentialMarketsProvider = ({ ...props }) => (
  <PotentialMarketsContext.Provider value={usePotentialMarketsContext()} {...props} />
);

export const usePotentialMarkets = () => useContext(PotentialMarketsContext);

const POTENTIAL_MARKETS_FILE_PATH = '/configs/otherMarketData.json';

const usePotentialMarketsContext = () => {
  const stringGetter = useStringGetter();
  const [potentialMarkets, setPotentialMarkets] = useState<NewMarketProposal[]>();

  useEffect(() => {
    try {
      fetch(POTENTIAL_MARKETS_FILE_PATH)
        .then((response) => response.json())
        .then((data: Record<string, Omit<NewMarketProposal, 'baseAsset'>>) => {
          const newPotentialMarkets = Object.entries(data).map(([key, value]) => ({
            ...value,
            baseAsset: key,
          }));
          setPotentialMarkets(newPotentialMarkets);
        });
    } catch (error) {
      console.log('usePotentialMarkets/potentialMarkets', error);
      setPotentialMarkets(undefined);
    }
  }, []);

  const liquidityTiers = useMemo(
    () => ({
      0: {
        label: stringGetter({ key: STRING_KEYS.LARGE_CAP }),
        initialMarginFraction: 0.05,
        maintenanceMarginFraction: 0.03,
        impactNotional: 10_000,
      },
      1: {
        label: stringGetter({ key: STRING_KEYS.MID_CAP }),
        initialMarginFraction: 0.1,
        maintenanceMarginFraction: 0.05,
        impactNotional: 5_000,
      },
      2: {
        label: stringGetter({ key: STRING_KEYS.LONG_TAIL }),
        initialMarginFraction: 0.2,
        maintenanceMarginFraction: 0.1,
        impactNotional: 2_500,
      },
      3: {
        label: stringGetter({ key: STRING_KEYS.SAFETY }),
        initialMarginFraction: 1,
        maintenanceMarginFraction: 0.2,
        impactNotional: 2_500,
      },
    }),
    [stringGetter]
  );

  return {
    potentialMarkets,
    hasPotentialMarketsData: Boolean(potentialMarkets),
    liquidityTiers,
  };
};
