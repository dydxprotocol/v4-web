import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  BECH32_PREFIX,
  CompositeClient,
  FaucetClient,
  IndexerClient,
  IndexerConfig,
  LocalWallet,
  Network,
  PnlTickInterval,
  SelectedGasDenom,
  ValidatorConfig,
  onboarding,
  type ProposalStatus,
} from '@dydxprotocol/v4-client-js';
import type { ResolutionString } from 'public/tradingview/charting_library';

import type { ConnectNetworkEvent, NetworkConfig } from '@/constants/abacus';
import { RawSubaccountFill, RawSubaccountTransfer } from '@/constants/account';
import { DEFAULT_TRANSACTION_MEMO } from '@/constants/analytics';
import { RESOLUTION_MAP, type Candle } from '@/constants/candles';
import { LocalStorageKey } from '@/constants/localStorage';
import { isDev } from '@/constants/networks';
import { StatsigFlags } from '@/constants/statsig';

import { getSelectedNetwork } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import abacusStateManager from '@/lib/abacus';
import { parseToPrimitives } from '@/lib/abacus/parseToPrimitives';
import { log } from '@/lib/telemetry';

import { useEndpointsConfig } from './useEndpointsConfig';
import { useLocalStorage } from './useLocalStorage';
import { useRestrictions } from './useRestrictions';
import { useStatsigGateValue } from './useStatsig';
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

  const selectedNetwork = useAppSelector(getSelectedNetwork);
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

  const enableTimestampNonce = useStatsigGateValue(StatsigFlags.ffEnableTimestampNonce);

  useEffect(() => {
    (async () => {
      if (
        networkConfig?.chainId &&
        networkConfig.indexerUrl &&
        networkConfig.websocketUrl &&
        networkConfig.validatorUrl
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
                DEFAULT_TRANSACTION_MEMO,
                enableTimestampNonce
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
      if (isDev && compositeClient) {
        compositeClient.validatorClient.setSelectedGasDenom(selectedGasDenom);
        abacusStateManager.setSelectedGasDenom(selectedGasDenom);
        setGasDenom(selectedGasDenom);
      }
    },
    [compositeClient, setGasDenom]
  );

  useEffect(() => {
    if (isDev && compositeClient) {
      setSelectedGasDenom(gasDenom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compositeClient, setSelectedGasDenom]);

  // ------ Wallet Methods ------ //
  const getWalletFromSignature = async ({ signature }: { signature: string }) => {
    const { mnemonic, privateKey, publicKey } =
      // This method should be renamed to deriveHDKeyFromSignature as it is used for both solana and ethereum signatures
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

  const getMegavaultHistoricalPnl = useCallback(
    async (resolution: PnlTickInterval = PnlTickInterval.day) => {
      try {
        return await indexerClient.vault.getMegavaultHistoricalPnl(resolution);
      } catch (error) {
        log('useDydxClient/getMegavaultHistoricalPnl', error);
        return undefined;
      }
    },
    [indexerClient.vault]
  );

  const getMegavaultPositions = useCallback(async () => {
    try {
      return await indexerClient.vault.getMegavaultPositions();
    } catch (error) {
      log('useDydxClient/getMegavaultPositions', error);
      return undefined;
    }
  }, [indexerClient.vault]);

  const getVaultsHistoricalPnl = useCallback(async () => {
    try {
      return await indexerClient.vault.getVaultsHistoricalPnl();
    } catch (error) {
      log('useDydxClient/getVaultsHistoricalPnl', error);
      return undefined;
    }
  }, [indexerClient.vault]);

  const getAllAccountTransfersBetween = useCallback(
    async (
      sourceAddress: string,
      sourceSubaccountNumber: string,
      recipientAddress: string,
      recipientSubaccountNumber: string
    ) => {
      try {
        return await indexerClient.account.getTransfersBetween(
          sourceAddress,
          sourceSubaccountNumber,
          recipientAddress,
          recipientSubaccountNumber
        );
      } catch (error) {
        log('useDydxClient/getAllAccountTransfersBetween', error);
        return undefined;
      }
    },
    [indexerClient.account]
  );

  const getVaultWithdrawInfo = useCallback(
    async (shares: number) => {
      try {
        const result = await compositeClient?.validatorClient.get.getMegavaultWithdrawalInfo(
          BigInt(shares)
        );
        if (result == null) {
          return result;
        }
        return parseToPrimitives(result);
      } catch (error) {
        log('useDydxClient/getVaultWithdrawInfo', error);
        return undefined;
      }
    },
    [compositeClient?.validatorClient.get]
  );

  const requestAllAccountFills = async (address: string, subaccountNumber: number) => {
    try {
      const {
        fills = [],
        totalResults,
        pageSize,
      } = await indexerClient.account.getParentSubaccountNumberFills(
        address,
        subaccountNumber,
        undefined,
        undefined,
        100,
        undefined,
        undefined,
        1
      );

      // We get all the pages but we should exclude the first one, we already have this data
      const pages = Array.from(
        {
          length: Math.ceil(totalResults / pageSize) - 1,
        },
        (_, index) => index + 2
      );

      const results = await Promise.all(
        pages.map((page) =>
          indexerClient.account.getParentSubaccountNumberFills(
            address,
            subaccountNumber,
            undefined,
            undefined,
            100,
            undefined,
            undefined,
            page
          )
        )
      );

      const allFills: RawSubaccountFill[] = [...fills, ...results.map((data) => data.fills).flat()];

      // sorts the data in descending order
      return allFills.sort((fillA, fillB) => {
        return new Date(fillB.createdAt).getTime() - new Date(fillA.createdAt).getTime();
      });
    } catch (error) {
      log('useDydxClient/requestAllAccountFills', error);
      return [];
    }
  };

  const requestAllAccountTransfers = async (address: string, subaccountNumber: number) => {
    try {
      const {
        transfers = [],
        totalResults,
        pageSize,
      } = await indexerClient.account.getParentSubaccountNumberTransfers(
        address,
        subaccountNumber,
        100,
        undefined,
        undefined,
        1
      );

      // We get all the pages but we should exclude the first one, we already have this data
      const pages = Array.from(
        {
          length: Math.ceil(totalResults / pageSize) - 1,
        },
        (_, index) => index + 2
      );

      const results = await Promise.all(
        pages.map((page) =>
          indexerClient.account.getParentSubaccountNumberTransfers(
            address,
            subaccountNumber,
            100,
            undefined,
            undefined,
            page
          )
        )
      );

      const allTransfers: RawSubaccountTransfer[] = [
        ...transfers,
        ...results.map((data) => data.transfers).flat(),
      ];

      // sorts the data in descending order
      return allTransfers.sort((transferA, transferB) => {
        return new Date(transferB.createdAt).getTime() - new Date(transferA.createdAt).getTime();
      });
    } catch (error) {
      log('useDydxClient/requestAllAccountTransfers', error);
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
        const allGovProposals =
          await compositeClient?.validatorClient.get.getAllGovProposals(proposalStatus);

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
          RESOLUTION_MAP[resolution]!,
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
        const oldestTime = new Date(candlesInRange[length - 1]!.startedAt).getTime();

        if (oldestTime > fromMs) {
          toIso = candlesInRange[length - 1]!.startedAt;
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
      addresses.map((address, index) => [address, !!results[index]?.restricted])
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
    // The perpetualId is 0 (parent subaccount number)
    return compositeClient?.validatorClient.get.getWithdrawalAndTransferGatingStatus(0);
  }, [compositeClient]);

  const getWithdrawalCapacityByDenom = useCallback(
    async ({ denom }: { denom: string }) => {
      return compositeClient?.validatorClient.get.getWithdrawalCapacityByDenom(denom);
    },
    [compositeClient]
  );

  const getValidators = useCallback(async () => {
    return compositeClient?.validatorClient.get.getAllValidators();
  }, [compositeClient]);

  const getAccountBalance = useCallback(
    async (address: string, denom: string) => {
      return compositeClient?.validatorClient.get.getAccountBalance(address, denom);
    },
    [compositeClient]
  );

  const getAffiliateInfo = useCallback(
    async (address: string) => {
      return compositeClient?.validatorClient.get.getAffiliateInfo(address);
    },
    [compositeClient]
  );

  const getAllAffiliateTiers = useCallback(async () => {
    const tiers = await compositeClient?.validatorClient.get.getAllAffiliateTiers();
    return tiers?.tiers?.tiers;
  }, [compositeClient]);

  const getReferredBy = useCallback(
    async (address: string) => {
      return compositeClient?.validatorClient.get.getReferredBy(address);
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
    getWalletFromSignature,

    // Public Methods
    requestAllAccountTransfers,
    requestAllAccountFills,
    requestAllPerpetualMarkets,
    requestAllGovernanceProposals,
    getCandlesForDatafeed,
    getCandles: requestCandles,
    getMarketTickSize,
    getPerpetualMarketSparklines,
    screenAddresses,
    getWithdrawalAndTransferGatingStatus,
    getWithdrawalCapacityByDenom,
    getValidators,
    getAccountBalance,
    getAffiliateInfo,
    getAllAffiliateTiers,
    getReferredBy,

    // vault methods
    getMegavaultHistoricalPnl,
    getMegavaultPositions,
    getVaultsHistoricalPnl,
    getAllAccountTransfersBetween,
    getVaultWithdrawInfo,
  };
};
