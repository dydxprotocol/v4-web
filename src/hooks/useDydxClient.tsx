import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  BECH32_PREFIX,
  CompositeClient,
  FaucetClient,
  IndexerClient,
  IndexerConfig,
  LocalWallet,
  Network,
  SelectedGasDenom,
  ValidatorConfig,
  onboarding,
  type ProposalStatus,
} from '@dydxprotocol/v4-client-js';
import type { ResolutionString } from 'public/tradingview/charting_library';
import { useSelector } from 'react-redux';

import type { ConnectNetworkEvent, NetworkConfig } from '@/constants/abacus';
import { DEFAULT_TRANSACTION_MEMO } from '@/constants/analytics';
import { RESOLUTION_MAP, type Candle } from '@/constants/candles';
import { LocalStorageKey } from '@/constants/localStorage';

import { getSelectedNetwork } from '@/state/appSelectors';

import abacusStateManager from '@/lib/abacus';
import { log } from '@/lib/telemetry';

import { useEndpointsConfig } from './useEndpointsConfig';
import { useLocalStorage } from './useLocalStorage';
import { useRestrictions } from './useRestrictions';
import { useTokenConfigs } from './useTokenConfigs';

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
  const { usdcDenom, usdcDecimals, usdcGasDenom, chainTokenDenom, chainTokenDecimals } =
    useTokenConfigs();

  const [networkConfig, setNetworkConfig] = useState<NetworkConfig>();

  useEffect(() => {
    const onConnectNetwork = (event: ConnectNetworkEvent) => setNetworkConfig(event.detail);

    globalThis.addEventListener('abacus:connectNetwork', onConnectNetwork);

    return () => globalThis.removeEventListener('abacus:connectNetwork', onConnectNetwork);
  }, []);

  // ------ Client Initialization ------ //

  const [compositeClient, setCompositeClient] = useState<CompositeClient>();
  const [faucetClient, setFaucetClient] = useState<FaucetClient>();

  const { indexer: indexerEndpoints } = useEndpointsConfig();
  const indexerClient = useMemo(() => {
    const config = new IndexerConfig(indexerEndpoints.api, indexerEndpoints.socket);
    return new IndexerClient(config);
  }, [indexerEndpoints]);

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
                  USDC_DENOM: usdcDenom,
                  USDC_DECIMALS: usdcDecimals,
                  USDC_GAS_DENOM: usdcGasDenom,
                  CHAINTOKEN_DENOM: chainTokenDenom,
                  CHAINTOKEN_DECIMALS: chainTokenDecimals,
                },
                {
                  broadcastPollIntervalMs: 3_000,
                  broadcastTimeoutMs: 60_000,
                },
                DEFAULT_TRANSACTION_MEMO
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

  // ------ Gas Denom ------ //

  const [gasDenom, setGasDenom] = useLocalStorage<SelectedGasDenom>({
    key: LocalStorageKey.SelectedGasDenom,
    defaultValue: SelectedGasDenom.USDC,
  });

  const setSelectedGasDenom = useCallback(
    (selectedGasDenom: SelectedGasDenom) => {
      if (compositeClient) {
        compositeClient.validatorClient.setSelectedGasDenom(selectedGasDenom);
        abacusStateManager.setSelectedGasDenom(selectedGasDenom);
        setGasDenom(selectedGasDenom);
      }
    },
    [compositeClient, setGasDenom]
  );

  useEffect(() => {
    if (compositeClient) {
      setSelectedGasDenom(gasDenom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compositeClient, setSelectedGasDenom]);

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
  const requestAllPerpetualMarkets = async () => {
    try {
      const { markets } = (await indexerClient.markets.getPerpetualMarkets()) ?? {};
      return markets || [];
    } catch (error) {
      log('useDydxClient/getPerpetualMarkets', error);
      return [];
    }
  };

  const getMarketTickSize = async (marketId: string) => {
    try {
      const { markets } = (await indexerClient.markets.getPerpetualMarkets(marketId)) ?? {};
      return markets?.[marketId]?.tickSize;
    } catch (error) {
      log('useDydxClient/getMarketTickSize', error);
      return undefined;
    }
  };

  /**
   * @param proposalStatus - Optional filter for proposal status. If not provided, all proposals in ProposalStatus.VotingPeriod will be returned.
   */
  const requestAllGovernanceProposals = useCallback(
    async (proposalStatus?: ProposalStatus) => {
      try {
        const allGovProposals = await compositeClient?.validatorClient.get.getAllGovProposals(
          proposalStatus
        );

        return allGovProposals;
      } catch (error) {
        log('useDydxClient/getProposals', error);
        return undefined;
      }
    },
    [compositeClient]
  );

  const requestCandles = async ({
    marketId,
    resolution,
    fromIso,
    toIso,
    limit,
  }: {
    marketId: string;
    resolution: ResolutionString;
    fromIso?: string;
    toIso?: string;
    limit?: number;
  }): Promise<Candle[]> => {
    try {
      const { candles } =
        (await indexerClient.markets.getPerpetualMarketCandles(
          marketId,
          RESOLUTION_MAP[resolution],
          fromIso,
          toIso,
          limit
        )) || {};
      return candles || [];
    } catch (error) {
      log('useDydxClient/getPerpetualMarketCandles', error);
      return [];
    }
  };

  const getCandlesForDatafeed = async ({
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

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // eslint-disable-next-line no-await-in-loop
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
  };

  const { updateSanctionedAddresses } = useRestrictions();

  const screenAddresses = async ({ addresses }: { addresses: string[] }) => {
    const promises = addresses.map((address) => indexerClient.utility.screen(address));

    const results = await Promise.all(promises);

    const screenedAddresses = Object.fromEntries(
      addresses.map((address, index) => [address, results[index]?.restricted])
    );

    updateSanctionedAddresses(screenedAddresses);
    return screenedAddresses;
  };

  const getPerpetualMarketSparklines = async ({
    period = 'SEVEN_DAYS',
  }: {
    period?: 'ONE_DAY' | 'SEVEN_DAYS';
  }) => indexerClient.markets.getPerpetualMarketSparklines(period);

  const getWithdrawalAndTransferGatingStatus = useCallback(async () => {
    return compositeClient?.validatorClient.get.getWithdrawalAndTransferGatingStatus();
  }, [compositeClient]);

  const getWithdrawalCapacityByDenom = useCallback(
    async ({ denom }: { denom: string }) => {
      return compositeClient?.validatorClient.get.getWithdrawalCapacityByDenom(denom);
    },
    [compositeClient]
  );

  return {
    // Client initialization
    connect: setNetworkConfig,
    networkConfig,
    compositeClient,
    faucetClient,
    indexerClient,
    isCompositeClientConnected: !!compositeClient,

    // Gas Denom
    setSelectedGasDenom,
    selectedGasDenom: gasDenom,

    // Wallet Methods
    getWalletFromEvmSignature,

    // Public Methods
    requestAllPerpetualMarkets,
    requestAllGovernanceProposals,
    getCandlesForDatafeed,
    getCandles: requestCandles,
    getMarketTickSize,
    getPerpetualMarketSparklines,
    screenAddresses,
    getWithdrawalAndTransferGatingStatus,
    getWithdrawalCapacityByDenom,
  };
};
