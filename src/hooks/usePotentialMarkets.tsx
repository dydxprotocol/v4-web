import { createContext, useContext, useEffect, useState } from 'react';

import type {
  ExchangeConfigItem,
  ExchangeConfigParsedCsv,
  PotentialMarketItem,
  PotentialMarketParsedCsv,
} from '@/constants/potentialMarkets';

import { log } from '@/lib/telemetry';

const PotentialMarketsContext = createContext<ReturnType<typeof usePotentialMarketsContext>>({
  potentialMarkets: undefined,
  exchangeConfigs: undefined,
  hasPotentialMarketsData: false,
});

PotentialMarketsContext.displayName = 'PotentialMarkets';

export const PotentialMarketsProvider = ({ ...props }) => (
  <PotentialMarketsContext.Provider value={usePotentialMarketsContext()} {...props} />
);

export const usePotentialMarkets = () => useContext(PotentialMarketsContext);

const EXCHANGE_CONFIG_FILE_PATH = '/configs/potentialMarketExchangeConfig.json';
const POTENTIAL_MARKETS_FILE_PATH = '/configs/potentialMarketParameters.json';

export const usePotentialMarketsContext = () => {
  const [potentialMarkets, setPotentialMarkets] = useState<PotentialMarketItem[]>();
  const [exchangeConfigs, setExchangeConfigs] = useState<Record<string, ExchangeConfigItem[]>>();

  useEffect(() => {
    try {
      fetch(POTENTIAL_MARKETS_FILE_PATH)
        .then((response) => response.json())
        .then((data) => {
          setPotentialMarkets(data as PotentialMarketItem[]);
        });
    } catch (error) {
      log('usePotentialMarkets/potentialMarkets', error);
      setPotentialMarkets(undefined);
    }

    try {
      fetch(EXCHANGE_CONFIG_FILE_PATH)
        .then((response) => response.json())
        .then((data) => {
          setExchangeConfigs(data as Record<string, ExchangeConfigItem[]>);
        });
    } catch (error) {
      log('usePotentialMarkets/exchangeConfigs', error);
      setExchangeConfigs(undefined);
    }
  }, []);

  return {
    potentialMarkets,
    exchangeConfigs,
    hasPotentialMarketsData: Boolean(potentialMarkets && exchangeConfigs),
  };
};
