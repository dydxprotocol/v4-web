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

import type { NetworkConfig, ConnectNetworkEvent } from '@/constants/abacus';
import { type Candle, RESOLUTION_MAP } from '@/constants/candles';

import { getSelectedNetwork } from '@/state/appSelectors';
import { log } from '@/lib/telemetry';
import { DydxAddress, EvmAddress } from '@/constants/wallets';

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

  const [networkConfig, setNetworkConfig] = useState<Partial<NetworkConfig>>();

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
        networkConfig?.indexerSocketUrl &&
        networkConfig?.validatorUrl
      ) {
        try {
          const initializedClient = await CompositeClient.connect(
            new Network(
              selectedNetwork,
              new IndexerConfig(networkConfig.indexerUrl, networkConfig.indexerSocketUrl),
              new ValidatorConfig(networkConfig.validatorUrl, networkConfig.chainId, {
                broadcastPollIntervalMs: 3_000,
                broadcastTimeoutMs: 60_000,
              })
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

  const screenAddress = useCallback(
    async ({ address }: { address: DydxAddress | EvmAddress }) => {
      try {
        return await compositeClient?.indexerClient.utility.screen(address);
      } catch (error) {
        log('useDydxClient/screenAddress', error);
      }
    },
    [compositeClient]
  );

  // ------ Subacount Methods ------ //

  return {
    // Client initialization
    connect: setNetworkConfig,
    networkConfig,
    compositeClient,
    faucetClient,

    // Wallet Methods
    getWalletFromEvmSignature,

    // Public Methods
    getCandlesForDatafeed,
    screenAddress,
  };
};
