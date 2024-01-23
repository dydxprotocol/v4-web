import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import {
  BECH32_PREFIX,
  CompositeClient,
  FaucetClient,
  IndexerConfig,
  LocalWallet,
  onboarding,
  Network,
  ValidatorConfig,
} from '@dydxprotocol/v4-client-js';

import type { ResolutionString } from 'public/tradingview/charting_library';

import type { ConnectNetworkEvent, NetworkConfig } from '@/constants/abacus';
import { type Candle, RESOLUTION_MAP } from '@/constants/candles';
import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';
import { DydxChainAsset } from '@/constants/wallets';

import { getSelectedNetwork } from '@/state/appSelectors';

import { log } from '@/lib/telemetry';

import { useRestrictions } from './useRestrictions';

type DydxContextType = ReturnType<typeof useDydxClientContext>;
const DydxContext = createContext<DydxContextType>({} as DydxContextType);
DydxContext.displayName = 'dYdXClient';

export const DydxProvider = ({ ...props }) => (
  <DydxContext.Provider value={useDydxClientContext()} {...props} />
);

export const useDydxClient = () => useContext(DydxContext);

const useDydxClientContext = () => {
  // ------ Network ------ //

  const selectedNetwork = useSelector(getSelectedNetwork);
  const tokensConfigs = ENVIRONMENT_CONFIG_MAP[selectedNetwork].tokens;

  const [networkConfig, setNetworkConfig] = useState<NetworkConfig>();

  useEffect(() => {
    const onConnectNetwork = (event: ConnectNetworkEvent) => setNetworkConfig(event.detail);

    globalThis.addEventListener('abacus:connectNetwork', onConnectNetwork);

    return () => globalThis.removeEventListener('abacus:connectNetwork', onConnectNetwork);
  }, []);

  // ------ Client Initialization ------ //

  const [compositeClient, setCompositeClient] = useState<CompositeClient>();
  const [faucetClient, setFaucetClient] = useState<FaucetClient>();

  useEffect(() => {
    (async () => {
      if (
        networkConfig?.chainId &&
        networkConfig?.indexerUrl &&
        networkConfig?.websocketUrl &&
        networkConfig?.validatorUrl
      ) {
        try {
          const initializedClient = await CompositeClient.connect(
            new Network(
              selectedNetwork,
              new IndexerConfig(networkConfig.indexerUrl, networkConfig.websocketUrl),
              new ValidatorConfig(
                networkConfig.validatorUrl,
                networkConfig.chainId,
                {
                  USDC_DENOM: tokensConfigs[DydxChainAsset.USDC].denom,
                  USDC_DECIMALS: tokensConfigs[DydxChainAsset.USDC].decimals,
                  USDC_GAS_DENOM: tokensConfigs[DydxChainAsset.USDC].gasDenom,
                  CHAINTOKEN_DENOM: tokensConfigs[DydxChainAsset.CHAINTOKEN].denom,
                  CHAINTOKEN_DECIMALS: tokensConfigs[DydxChainAsset.CHAINTOKEN].decimals,
                },
                {
                  broadcastPollIntervalMs: 3_000,
                  broadcastTimeoutMs: 60_000,
                }
              )
            )
          );
          setCompositeClient(initializedClient);
        } catch (error) {
          log('useDydxClient/initializeCompositeClient', error);
        }
      } else {
        setCompositeClient(undefined);
      }

      if (networkConfig?.faucetUrl) {
        setFaucetClient(new FaucetClient(networkConfig.faucetUrl));
      } else {
        setFaucetClient(undefined);
      }
    })();
  }, [networkConfig]);

  // ------ Wallet Methods ------ //
  const getWalletFromEvmSignature = async ({ signature }: { signature: string }) => {
    const { mnemonic, privateKey, publicKey } =
      onboarding.deriveHDKeyFromEthereumSignature(signature);

    return {
      wallet: await LocalWallet.fromMnemonic(mnemonic, BECH32_PREFIX),
      mnemonic,
      privateKey,
      publicKey,
    };
  };

  // ------ Public Methods ------ //
  const requestAllPerpetualMarkets = useCallback(async () => {
    try {
      const { markets } =
        (await compositeClient?.indexerClient.markets.getPerpetualMarkets()) || {};
      return markets || [];
    } catch (error) {
      log('useDydxClient/getPerpetualMarkets', error);
      return [];
    }
  }, [compositeClient]);

  const requestCandles = useCallback(
    async ({
      marketId,
      marketType = 'perpetualMarkets',
      resolution,
      fromIso,
      toIso,
    }: {
      marketId: string;
      marketType?: string;
      resolution: ResolutionString;
      fromIso?: string;
      toIso?: string;
    }): Promise<Candle[]> => {
      try {
        const { candles } =
          (await compositeClient?.indexerClient.markets.getPerpetualMarketCandles(
            marketId,
            RESOLUTION_MAP[resolution],
            fromIso,
            toIso
          )) || {};
        return candles || [];
      } catch (error) {
        log('useDydxClient/getPerpetualMarketCandles', error);
        return [];
      }
    },
    [compositeClient]
  );

  const getCandlesForDatafeed = useCallback(
    async ({
      marketId,
      resolution,
      fromMs,
      toMs,
    }: {
      marketId: string;
      resolution: ResolutionString;
      fromMs: number;
      toMs: number;
    }) => {
      const fromIso = new Date(fromMs).toISOString();
      let toIso = new Date(toMs).toISOString();
      const candlesInRange: Candle[] = [];

      while (true) {
        const candles = await requestCandles({
          marketId,
          resolution,
          fromIso,
          toIso,
        });

        if (!candles || candles.length === 0) {
          break;
        }

        candlesInRange.push(...candles);
        const length = candlesInRange.length;

        if (length) {
          const oldestTime = new Date(candlesInRange[length - 1].startedAt).getTime();

          if (oldestTime > fromMs) {
            toIso = candlesInRange[length - 1].startedAt;
          } else {
            break;
          }
        } else {
          break;
        }
      }

      return candlesInRange;
    },
    [requestCandles]
  );

  const { updateSanctionedAddresses } = useRestrictions();

  const screenAddresses = useCallback(
    async ({ addresses }: { addresses: string[] }) => {
      if (compositeClient) {
        const promises = addresses.map((address) =>
          compositeClient.indexerClient.utility.screen(address)
        );

        const results = await Promise.all(promises);

        const screenedAddresses = Object.fromEntries(
          addresses.map((address, index) => [address, results[index]?.restricted])
        );

        updateSanctionedAddresses(screenedAddresses);
        return screenedAddresses;
      }
    },
    [compositeClient]
  );

  return {
    // Client initialization
    connect: setNetworkConfig,
    networkConfig,
    compositeClient,
    faucetClient,
    isConnected: !!compositeClient,

    // Wallet Methods
    getWalletFromEvmSignature,

    // Public Methods
    requestAllPerpetualMarkets,
    getCandlesForDatafeed,
    screenAddresses,
  };
};
