import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import type { Nullable } from '@dydxprotocol/v4-abacus';
import Long from 'long';
import type { IndexedTx } from '@cosmjs/stargate';
import type { EncodeObject, Coin } from '@cosmjs/proto-signing';
import { Method } from '@cosmjs/tendermint-rpc';

import {
  LocalWallet,
  SubaccountClient,
  DYDX_DENOM,
  USDC_DENOM,
  GAS_PRICE_DYDX_DENOM,
} from '@dydxprotocol/v4-client-js';

import type {
  HumanReadableCancelOrderPayload,
  HumanReadablePlaceOrderPayload,
  ParsingError,
  SubAccountHistoricalPNLs,
} from '@/constants/abacus';

import { AMOUNT_RESERVED_FOR_GAS_USDC } from '@/constants/account';
import { AnalyticsEvent } from '@/constants/analytics';
import { QUANTUM_MULTIPLIER } from '@/constants/numbers';
import { DydxAddress } from '@/constants/wallets';

import { setSubaccount, setHistoricalPnl } from '@/state/account';

import abacusStateManager from '@/lib/abacus';
import { track } from '@/lib/analytics';
import { MustBigNumber } from '@/lib/numbers';
import { log } from '@/lib/telemetry';

import { useAccounts } from './useAccounts';
import { useDydxClient } from './useDydxClient';
import { usePollUSDCBalance } from './usePollUSDCBalance';

type SubaccountContextType = ReturnType<typeof useSubaccountContext>;
const SubaccountContext = createContext<SubaccountContextType>({} as SubaccountContextType);
SubaccountContext.displayName = 'Subaccount';

export const SubaccountProvider = ({ ...props }) => {
  const { localDydxWallet } = useAccounts();

  return (
    <SubaccountContext.Provider value={useSubaccountContext({ localDydxWallet })} {...props} />
  );
};

export const useSubaccount = () => useContext(SubaccountContext);

export const useSubaccountContext = ({ localDydxWallet }: { localDydxWallet?: LocalWallet }) => {
  const dispatch = useDispatch();
  const { compositeClient, faucetClient } = useDydxClient();

  const { getFaucetFunds } = useMemo(
    () => ({
      getFaucetFunds: async ({
        dydxAddress,
        subaccountNumber,
      }: {
        dydxAddress: DydxAddress;
        subaccountNumber: number;
      }) => await faucetClient?.fill(dydxAddress, subaccountNumber, 100),
    }),
    [faucetClient]
  );

  const {
    depositToSubaccount,
    withdrawFromSubaccount,
    simulateWithdrawFromSubaccount,
    transferFromSubaccountToAddress,
    transferNativeToken,
    simulateTransferNativeToken,
    sendSquidWithdrawFromSubaccount,
  } = useMemo(
    () => ({
      depositToSubaccount: async ({
        subaccountClient,
        assetId = 0,
        amount,
      }: {
        subaccountClient: SubaccountClient;
        assetId?: number;
        amount: Long;
      }) => await compositeClient?.validatorClient.post.deposit(subaccountClient, assetId, amount),

      withdrawFromSubaccount: async ({
        subaccountClient,
        amount,
      }: {
        subaccountClient: SubaccountClient;
        amount: number;
      }) => await compositeClient?.withdrawFromSubaccount(subaccountClient, amount),

      simulateWithdrawFromSubaccount: async ({
        subaccountClient,
        amount,
        recipient,
      }: {
        subaccountClient: SubaccountClient;
        amount: number;
        recipient?: string;
      }) => {
        return await compositeClient?.simulate(
          subaccountClient?.wallet,
          () =>
            new Promise((resolve) => {
              const msg = compositeClient?.withdrawFromSubaccountMessage(
                subaccountClient,
                amount,
                recipient
              );

              resolve([msg]);
            }),
          undefined
        );
      },

      transferFromSubaccountToAddress: async ({
        subaccountClient,
        assetId = 0,
        amount,
        recipient,
      }: {
        subaccountClient: SubaccountClient;
        assetId?: number;
        amount: number;
        recipient: string;
      }) =>
        await compositeClient?.validatorClient.post.send(
          subaccountClient?.wallet,
          () =>
            new Promise((resolve) => {
              const msg =
                compositeClient?.validatorClient.post.composer.composeMsgWithdrawFromSubaccount(
                  subaccountClient.address,
                  subaccountClient.subaccountNumber,
                  assetId,
                  Long.fromNumber(amount * QUANTUM_MULTIPLIER),
                  recipient
                );

              resolve([msg]);
            }),
          false,
          undefined,
          undefined,
          Method.BroadcastTxCommit
        ),

      transferNativeToken: async ({
        subaccountClient,
        amount,
        recipient,
      }: {
        subaccountClient: SubaccountClient;
        amount: number;
        recipient: string;
      }) =>
        await compositeClient?.validatorClient.post.sendToken(
          subaccountClient,
          recipient,
          DYDX_DENOM,
          Long.fromNumber(amount * QUANTUM_MULTIPLIER),
          false,
          Method.BroadcastTxCommit
        ),

      simulateTransferNativeToken: async ({
        subaccountClient,
        amount,
        recipient,
      }: {
        subaccountClient: SubaccountClient;
        amount: number;
        recipient: string;
      }) =>
        await compositeClient?.simulate(
          subaccountClient?.wallet,
          () =>
            new Promise((resolve) => {
              const msg = compositeClient?.validatorClient.post.composer.composeMsgSendToken(
                subaccountClient.address,
                recipient,
                DYDX_DENOM,
                Long.fromNumber(amount * QUANTUM_MULTIPLIER)
              );

              resolve([msg]);
            }),
          GAS_PRICE_DYDX_DENOM,
          undefined
        ),
      sendSquidWithdrawFromSubaccount: async ({
        subaccountClient,
        amount,
        payload,
      }: {
        subaccountClient: SubaccountClient;
        amount: number;
        payload: string;
      }) => {
        if (!compositeClient) throw new Error('client not initialized');

        const transaction = JSON.parse(payload);

        const msg = compositeClient.withdrawFromSubaccountMessage(subaccountClient, amount);
        const ibcMsg: EncodeObject = {
          typeUrl: transaction.msgTypeUrl,
          value: transaction.msg,
        };

        return await compositeClient.send(
          subaccountClient.wallet,
          () => Promise.resolve([msg, ibcMsg]),
          false
        );
      },
    }),
    [compositeClient]
  );

  const [subaccountNumber, setSubaccountNumber] = useState(0);

  useEffect(() => {
    abacusStateManager.setSubaccountNumber(subaccountNumber);
  }, [subaccountNumber]);

  const subaccountClient = useMemo(
    () => (localDydxWallet ? new SubaccountClient(localDydxWallet, subaccountNumber) : undefined),
    [localDydxWallet, subaccountNumber]
  );

  const dydxAddress = localDydxWallet?.address as DydxAddress;

  useEffect(() => {
    dispatch(setSubaccount(undefined));
    dispatch(setHistoricalPnl([] as unknown as SubAccountHistoricalPNLs));
  }, [dydxAddress]);

  // ------ Deposit/Withdraw Methods ------ //
  const depositFunds = useCallback(
    async (balance?: Coin) => {
      if (!localDydxWallet) return;

      const amountAfterDust = MustBigNumber(balance?.amount)
        .minus(AMOUNT_RESERVED_FOR_GAS_USDC) // keep 0.1 USDC in user's wallet for gas
        .toString();

      const amount = Long.fromString(amountAfterDust || '0');

      if (amount.greaterThan(Long.ZERO)) {
        const subaccountClient = new SubaccountClient(localDydxWallet, 0);
        await depositToSubaccount({ amount, subaccountClient });
      }
    },
    [localDydxWallet, depositToSubaccount]
  );

  const balance = usePollUSDCBalance({ dydxAddress });

  useEffect(() => {
    depositFunds(balance);
  }, [balance]);

  const deposit = useCallback(
    async (amount: Long) => {
      if (!subaccountClient) {
        return;
      }

      return await depositToSubaccount({ subaccountClient, amount });
    },
    [subaccountClient, depositToSubaccount]
  );

  const withdraw = useCallback(
    async (amount: number) => {
      if (!subaccountClient) {
        return;
      }

      return await withdrawFromSubaccount({ subaccountClient, amount });
    },
    [subaccountClient, withdrawFromSubaccount]
  );

  // ------ Transfer Methods ------ //

  const transfer = useCallback(
    async (amount: number, recipient: string, coinDenom: string) => {
      if (!subaccountClient) {
        return;
      }

      return (await (coinDenom === USDC_DENOM
        ? transferFromSubaccountToAddress
        : transferNativeToken)({ subaccountClient, amount, recipient })) as IndexedTx;
    },
    [subaccountClient, transferFromSubaccountToAddress, transferNativeToken]
  );

  const simulateTransfer = useCallback(
    async (amount: number, recipient: string, coinDenom: string) => {
      if (!subaccountClient) {
        return;
      }

      return await (coinDenom === USDC_DENOM
        ? simulateWithdrawFromSubaccount
        : simulateTransferNativeToken)({ subaccountClient, amount, recipient });
    },
    [subaccountClient, simulateWithdrawFromSubaccount, simulateTransferNativeToken]
  );

  const simulateWithdraw = useCallback(
    async (amount: number) => {
      if (!subaccountClient) {
        return;
      }

      return await simulateWithdrawFromSubaccount({ subaccountClient, amount });
    },
    [subaccountClient, simulateWithdrawFromSubaccount]
  );

  const sendSquidWithdraw = useCallback(
    async (amount: number, payload: string) => {
      if (!subaccountClient) {
        return;
      }

      return await sendSquidWithdrawFromSubaccount({ subaccountClient, amount, payload });
    },
    [subaccountClient, sendSquidWithdrawFromSubaccount]
  );

  // ------ Faucet Methods ------ //
  const requestFaucetFunds = useCallback(async () => {
    if (!dydxAddress) return;

    try {
      await getFaucetFunds({ dydxAddress, subaccountNumber });
    } catch (error) {
      log('useSubaccount/getFaucetFunds', error);
    }
  }, [dydxAddress, getFaucetFunds, subaccountNumber]);

  // ------ Trading Methods ------ //
  const placeOrder = useCallback(
    async ({
      isClosePosition = false,
      onError,
      onSuccess,
    }: {
      isClosePosition?: boolean;
      onError?: (onErrorParams?: { errorStringKey?: Nullable<string> }) => void;
      onSuccess?: () => void;
    }) => {
      const callback = (success: boolean, parsingError?: Nullable<ParsingError>) => {
        const params: Nullable<HumanReadablePlaceOrderPayload | HumanReadableCancelOrderPayload> =
          abacusStateManager[isClosePosition ? 'closePositionPayload' : 'placeOrderPayload']();

        if (success) {
          track(AnalyticsEvent.TradePlaceOrder, {
            ...params,
            isClosePosition,
          } as HumanReadablePlaceOrderPayload & { isClosePosition: boolean });

          onSuccess?.();
        } else {
          onError?.({ errorStringKey: parsingError?.stringKey });
        }
      };

      if (isClosePosition) {
        abacusStateManager.closePosition(callback);
      } else {
        abacusStateManager.placeOrder(callback);
      }
    },
    [subaccountClient]
  );

  const closePosition = useCallback(
    async ({
      onError,
      onSuccess,
    }: {
      onError: (onErrorParams?: { errorStringKey?: Nullable<string> }) => void;
      onSuccess?: () => void;
    }) => await placeOrder({ isClosePosition: true, onError, onSuccess }),
    [placeOrder]
  );

  const cancelOrder = useCallback(
    async ({
      orderId,
      onError,
      onSuccess,
    }: {
      orderId: string;
      onError?: ({ errorStringKey }?: { errorStringKey?: Nullable<string> }) => void;
      onSuccess?: () => void;
    }) => {
      const callback = (success: boolean, parsingError?: Nullable<ParsingError>) => {
        if (success) {
          track(AnalyticsEvent.TradeCancelOrder);

          onSuccess?.();
        } else {
          onError?.({ errorStringKey: parsingError?.stringKey });
        }
      };

      abacusStateManager.cancelOrder(orderId, callback);
    },
    [subaccountClient]
  );

  return {
    // Deposit/Withdraw/Faucet Methods
    deposit,
    withdraw,
    requestFaucetFunds,

    // Transfer Methods
    simulateTransfer,
    transfer,
    simulateWithdraw,
    sendSquidWithdraw,

    // Trading Methods
    placeOrder,
    closePosition,
    cancelOrder,
  };
};
