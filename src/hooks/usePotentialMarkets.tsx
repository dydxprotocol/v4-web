import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { STRING_KEYS } from '@/constants/localization';
import { LIQUIDITY_TIERS } from '@/constants/markets';
import type { NewMarketProposal } from '@/constants/potentialMarkets';

import { log } from '@/lib/telemetry';

import { useStringGetter } from './useStringGetter';

const PotentialMarketsContext = createContext<ReturnType<typeof usePotentialMarketsContext>>({
  potentialMarkets: undefined,
  hasPotentialMarketsData: false,
  liquidityTiers: LIQUIDITY_TIERS,
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
      log('usePotentialMarkets/potentialMarkets', error);
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
        label: 'Small-cap',
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
      4: {
        label: stringGetter({ key: STRING_KEYS.ISOLATED }),
        initialMarginFraction: 0.05,
        maintenanceMarginFraction: 0.03,
        impactNotional: 2_500,
      },
      5: {
        label: stringGetter({ key: STRING_KEYS.MID_CAP }),
        initialMarginFraction: 0.05,
        maintenanceMarginFraction: 0.03,
        impactNotional: 5_000,
      },
      6: {
        label: 'FX',
        initialMarginFraction: 0.01,
        maintenanceMarginFraction: 0.0005,
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
