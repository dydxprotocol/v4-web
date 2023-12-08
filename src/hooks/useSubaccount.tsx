import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import type { Nullable } from '@dydxprotocol/v4-abacus';
import Long from 'long';
import type { IndexedTx } from '@cosmjs/stargate';
import type { EncodeObject } from '@cosmjs/proto-signing';
import { Method } from '@cosmjs/tendermint-rpc';

import { type LocalWallet, SubaccountClient } from '@dydxprotocol/v4-client-js';

import type {
  AccountBalance,
  HumanReadablePlaceOrderPayload,
  ParsingError,
  SubAccountHistoricalPNLs,
} from '@/constants/abacus';

import { AMOUNT_RESERVED_FOR_GAS_USDC } from '@/constants/account';
import { AnalyticsEvent } from '@/constants/analytics';
import { QUANTUM_MULTIPLIER } from '@/constants/numbers';
import { DydxAddress } from '@/constants/wallets';

import { setSubaccount, setHistoricalPnl, removeUncommittedOrderClientId } from '@/state/account';
import { getBalances } from '@/state/accountSelectors';

import abacusStateManager from '@/lib/abacus';
import { track } from '@/lib/analytics';
import { MustBigNumber } from '@/lib/numbers';
import { log } from '@/lib/telemetry';

import { useAccounts } from './useAccounts';
import { useTokenConfigs } from './useTokenConfigs';
import { useDydxClient } from './useDydxClient';

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
  const { usdcDenom, usdcDecimals } = useTokenConfigs();
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
    transferFromSubaccountToAddress,
    transferNativeToken,
    sendSquidWithdrawFromSubaccount,
  } = useMemo(
    () => ({
      depositToSubaccount: async ({
        subaccountClient,
        amount,
      }: {
        subaccountClient: SubaccountClient;
        assetId?: number;
        amount: number;
      }) => {
        try {
          return await compositeClient?.depositToSubaccount(
            subaccountClient,
            amount.toFixed(usdcDecimals)
          );
        } catch (error) {
          log('useSubaccount/depositToSubaccount', error);
          throw error;
        }
      },
      withdrawFromSubaccount: async ({
        subaccountClient,
        amount,
      }: {
        subaccountClient: SubaccountClient;
        amount: number;
      }) => {
        try {
          return await compositeClient?.withdrawFromSubaccount(
            subaccountClient,
            amount.toFixed(usdcDecimals)
          );
        } catch (error) {
          log('useSubaccount/withdrawFromSubaccount', error);
          throw error;
        }
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
      }) => {
        try {
          return await compositeClient?.validatorClient.post.send(
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
          );
        } catch (error) {
          log('useSubaccount/transferFromSubaccountToAddress', error);
          throw error;
        }
      },

      transferNativeToken: async ({
        subaccountClient,
        amount,
        recipient,
      }: {
        subaccountClient: SubaccountClient;
        amount: number;
        recipient: string;
      }) => {
        try {
          return await compositeClient?.validatorClient.post.send(
            subaccountClient.wallet,
            () =>
              new Promise((resolve) => {
                const msg = compositeClient?.sendTokenMessage(
                  subaccountClient.wallet,
                  amount.toString(),
                  recipient
                );

                resolve([msg]);
              }),
            false,
            compositeClient?.validatorClient?.post.defaultDydxGasPrice,
            undefined,
            Method.BroadcastTxCommit
          );
        } catch (error) {
          log('useSubaccount/transferNativeToken', error);
          throw error;
        }
      },

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
        try {
          const transaction = JSON.parse(payload);

          const msg = compositeClient.withdrawFromSubaccountMessage(
            subaccountClient,
            amount.toFixed(usdcDecimals)
          );
          const ibcMsg: EncodeObject = {
            typeUrl: transaction.msgTypeUrl,
            value: transaction.msg,
          };

          return await compositeClient.send(
            subaccountClient.wallet,
            () => Promise.resolve([msg, ibcMsg]),
            false
          );
        } catch (error) {
          log('useSubaccount/sendSquidWithdrawFromSubaccount', error);
          throw error;
        }
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
    async (balance: AccountBalance) => {
      if (!localDydxWallet) return;

      const amount = parseFloat(balance.amount) - AMOUNT_RESERVED_FOR_GAS_USDC;

      if (amount > 0) {
        const subaccountClient = new SubaccountClient(localDydxWallet, 0);
        await depositToSubaccount({ amount, subaccountClient });
      }
    },
    [localDydxWallet, depositToSubaccount]
  );

  const balances = useSelector(getBalances, shallowEqual);
  const usdcCoinBalance = balances?.[usdcDenom];

  useEffect(() => {
    if (usdcCoinBalance) {
      depositFunds(usdcCoinBalance);
    }
  }, [usdcCoinBalance]);

  const deposit = useCallback(
    async (amount: number) => {
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
      return (await (coinDenom === usdcDenom
        ? transferFromSubaccountToAddress
        : transferNativeToken)({ subaccountClient, amount, recipient })) as IndexedTx;
    },
    [subaccountClient, transferFromSubaccountToAddress, transferNativeToken]
  );

  const sendSquidWithdraw = useCallback(
    async (amount: number, payload: string, isCCtp?: boolean) => {
      
      const cctpWithdraw = () => {
        return new Promise<string>((resolve, reject) => 
          abacusStateManager.cctpWithdraw((success, error, data) => {
            const parsedData = JSON.parse(data);
            if (success && parsedData?.code == 0) {
              resolve(parsedData?.transactionHash);
            } else {
              reject(error);
            }
          })
        )
      }
      if (isCCtp) {
        return await cctpWithdraw();
      }

      if (!subaccountClient) {
        return;
      }
      const txHash = await sendSquidWithdrawFromSubaccount({ subaccountClient, amount, payload });
      return `0x${Buffer.from(txHash?.hash).toString('hex')}`;
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
      throw error;
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
      onSuccess?: (placeOrderPayload: Nullable<HumanReadablePlaceOrderPayload>) => void;
    }) => {
      const callback = (
        success: boolean,
        parsingError?: Nullable<ParsingError>,
        data?: Nullable<HumanReadablePlaceOrderPayload>
      ) => {
        if (success) {
          onSuccess?.(data);
        } else {
          onError?.({ errorStringKey: parsingError?.stringKey });

          if (data?.clientId !== undefined) {
            dispatch(removeUncommittedOrderClientId(data.clientId));
          }
        }
      };

      let placeOrderParams;

      if (isClosePosition) {
        placeOrderParams = abacusStateManager.closePosition(callback);
      } else {
        placeOrderParams = abacusStateManager.placeOrder(callback);
      }

      return placeOrderParams;
    },
    [subaccountClient]
  );

  const closePosition = useCallback(
    async ({
      onError,
      onSuccess,
    }: {
      onError: (onErrorParams?: { errorStringKey?: Nullable<string> }) => void;
      onSuccess?: (placeOrderPayload: Nullable<HumanReadablePlaceOrderPayload>) => void;
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
    transfer,
    sendSquidWithdraw,

    // Trading Methods
    placeOrder,
    closePosition,
    cancelOrder,
  };
};
