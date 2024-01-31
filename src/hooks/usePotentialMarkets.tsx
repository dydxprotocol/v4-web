import { createContext, useContext, useEffect, useState } from 'react';

import type {
  ExchangeConfigItem,
  ExchangeConfigParsedCsv,
  PotentialMarketItem,
  PotentialMarketParsedCsv,
} from '@/constants/potentialMarkets';

import csvToArray from '@/lib/csvToArray';
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

const EXCHANGE_CONFIG_FILE_PATH = '/configs/potentialMarketExchangeConfig.csv';
const POTENTIAL_MARKETS_FILE_PATH = '/configs/potentialMarketParameters.csv';

export const usePotentialMarketsContext = () => {
  const [potentialMarkets, setPotentialMarkets] = useState<PotentialMarketItem[]>();
  const [exchangeConfigs, setExchangeConfigs] = useState<Record<string, ExchangeConfigItem[]>>();

  useEffect(() => {
    try {
      fetch(POTENTIAL_MARKETS_FILE_PATH)
        .then((response) => response.text())
        .then((data) => {
          const parsedData = csvToArray<PotentialMarketParsedCsv>({
            stringVal: data,
            splitter: ',',
          });
          const parsedPotentialMarkets = parsedData.map(
            ({
              base_asset,
              reference_price,
              num_oracles,
              liquidity_tier,
              asset_name,
              p,
              atomic_resolution,
              min_exchanges,
              min_price_change_ppm,
              price_exponent,
              step_base_quantum,
              ticksize_exponent,
              subticks_per_tick,
              min_order_size,
              quantum_conversion_exponent,
            }) => ({
              // convert to camelCase
              baseAsset: base_asset,
              referencePrice: reference_price,
              numOracles: Number(num_oracles),
              liquidityTier: Number(liquidity_tier),
              assetName: asset_name,
              p: Number(p),
              atomicResolution: Number(atomic_resolution),
              minExchanges: Number(min_exchanges),
              minPriceChangePpm: Number(min_price_change_ppm),
              priceExponent: Number(price_exponent),
              stepBaseQuantum: Number(step_base_quantum),
              ticksizeExponent: Number(ticksize_exponent),
              subticksPerTick: Number(subticks_per_tick),
              minOrderSize: Number(min_order_size),
              quantumConversionExponent: Number(quantum_conversion_exponent),
            })
          );

          setPotentialMarkets(parsedPotentialMarkets);
        });
    } catch (error) {
      log('usePotentialMarkets/potentialMarkets', error);
      setPotentialMarkets(undefined);
    }

    try {
      fetch(EXCHANGE_CONFIG_FILE_PATH)
        .then((response) => response.text())
        .then((data) => {
          const parsedData = csvToArray<ExchangeConfigParsedCsv>({
            stringVal: data,
            splitter: ',',
          });
          // create an object with the base_asset as the key and the value as an array of exchanges
          const exchangeConfigMap = parsedData.reduce(
            (acc: Record<string, ExchangeConfigItem[]>, curr) => {
              const { base_asset, exchange, pair, adjust_by_market } = curr;
              if (!acc[base_asset]) {
                acc[base_asset] = [];
              }

              const exchangeItem: {
                exchangeName: string;
                ticker: string;
                adjustByMarket?: string;
              } = {
                exchangeName: exchange,
                ticker: pair,
              };

              if (adjust_by_market) {
                exchangeItem.adjustByMarket = adjust_by_market;
              }

              acc[base_asset].push(exchangeItem);
              return acc;
            },
            {}
          );

          setExchangeConfigs(exchangeConfigMap);
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
