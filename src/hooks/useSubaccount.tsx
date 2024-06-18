import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { EncodeObject } from '@cosmjs/proto-signing';
import { type IndexedTx } from '@cosmjs/stargate';
import { Method } from '@cosmjs/tendermint-rpc';
import type { Nullable } from '@dydxprotocol/v4-abacus';
import {
  SubaccountClient,
  utils,
  type GovAddNewMarketParams,
  type LocalWallet,
} from '@dydxprotocol/v4-client-js';
import Long from 'long';
import { shallowEqual } from 'react-redux';
import { parseUnits } from 'viem';

import type {
  AccountBalance,
  HumanReadableCancelOrderPayload,
  HumanReadablePlaceOrderPayload,
  HumanReadableSubaccountTransferPayload,
  HumanReadableTriggerOrdersPayload,
  ParsingError,
} from '@/constants/abacus';
import { AMOUNT_RESERVED_FOR_GAS_USDC, AMOUNT_USDC_BEFORE_REBALANCE } from '@/constants/account';
import { STRING_KEYS } from '@/constants/localization';
import { QUANTUM_MULTIPLIER } from '@/constants/numbers';
import { TradeTypes } from '@/constants/trade';
import { DydxAddress } from '@/constants/wallets';

import {
  cancelOrderConfirmed,
  cancelOrderFailed,
  cancelOrderSubmitted,
  placeOrderFailed,
  placeOrderSubmitted,
  setHistoricalPnl,
  setSubaccount,
} from '@/state/account';
import { getBalances } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';

import abacusStateManager from '@/lib/abacus';
import { isTruthy } from '@/lib/isTruthy';
import { log } from '@/lib/telemetry';
import { hashFromTx } from '@/lib/txUtils';

import { useAccounts } from './useAccounts';
import { useDydxClient } from './useDydxClient';
import { useGovernanceVariables } from './useGovernanceVariables';
import { useTokenConfigs } from './useTokenConfigs';

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

const useSubaccountContext = ({ localDydxWallet }: { localDydxWallet?: LocalWallet }) => {
  const dispatch = useAppDispatch();
  const { usdcDenom, usdcDecimals, chainTokenDecimals } = useTokenConfigs();
  const { compositeClient, faucetClient } = useDydxClient();

  const { getFaucetFunds, getNativeTokens } = useMemo(
    () => ({
      getFaucetFunds: async ({
        dydxAddress,
        subaccountNumber,
      }: {
        dydxAddress: DydxAddress;
        subaccountNumber: number;
      }) => faucetClient?.fill(dydxAddress, subaccountNumber, 100),

      getNativeTokens: async ({ dydxAddress }: { dydxAddress: DydxAddress }) =>
        faucetClient?.fillNative(dydxAddress),
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
        memo,
      }: {
        subaccountClient: SubaccountClient;
        amount: number;
        recipient: string;
        memo?: string;
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
            memo,
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
            value: {
              ...transaction.msg,
              timeoutTimestamp: transaction.msg.timeoutTimestamp
                ? // Squid returns timeoutTimestamp as Long, but the signer expects BigInt
                  BigInt(Long.fromValue(transaction.msg.timeoutTimestamp).toString())
                : undefined,
            },
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
    [compositeClient, usdcDecimals]
  );

  const [subaccountNumber] = useState(0);

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
    dispatch(setHistoricalPnl([]));
  }, [dispatch, dydxAddress]);

  // ------ Deposit/Withdraw Methods ------ //
  const rebalanceWalletFunds = useCallback(
    async (balance: AccountBalance) => {
      if (!subaccountClient) return;
      const balanceAmount = parseFloat(balance.amount);
      const shouldDeposit = balanceAmount - AMOUNT_RESERVED_FOR_GAS_USDC > 0;
      const shouldWithdraw = balanceAmount - AMOUNT_USDC_BEFORE_REBALANCE <= 0;

      if (shouldDeposit) {
        await depositToSubaccount({
          amount: balanceAmount - AMOUNT_RESERVED_FOR_GAS_USDC,
          subaccountClient,
        });
      } else if (shouldWithdraw) {
        await withdrawFromSubaccount({
          amount: AMOUNT_RESERVED_FOR_GAS_USDC - balanceAmount,
          subaccountClient,
        });
      }
    },
    [subaccountClient, depositToSubaccount, withdrawFromSubaccount]
  );

  const balances = useAppSelector(getBalances, shallowEqual);
  const usdcCoinBalance = balances?.[usdcDenom];

  useEffect(() => {
    if (usdcCoinBalance) {
      rebalanceWalletFunds(usdcCoinBalance);
    }
  }, [usdcCoinBalance, rebalanceWalletFunds]);

  const deposit = useCallback(
    async (amount: number) => {
      if (!subaccountClient) {
        return undefined;
      }

      return depositToSubaccount({ subaccountClient, amount });
    },
    [subaccountClient, depositToSubaccount]
  );

  const withdraw = useCallback(
    async (amount: number) => {
      if (!subaccountClient) {
        return undefined;
      }

      return withdrawFromSubaccount({ subaccountClient, amount });
    },
    [subaccountClient, withdrawFromSubaccount]
  );

  // ------ Transfer Methods ------ //

  const transfer = useCallback(
    async (amount: number, recipient: string, coinDenom: string, memo?: string) => {
      if (!subaccountClient) {
        return undefined;
      }
      return (await (coinDenom === usdcDenom
        ? transferFromSubaccountToAddress({ subaccountClient, amount, recipient })
        : transferNativeToken({ subaccountClient, amount, recipient, memo }))) as IndexedTx;
    },
    [subaccountClient, transferFromSubaccountToAddress, transferNativeToken, usdcDenom]
  );

  const sendSquidWithdraw = useCallback(
    async (amount: number, payload: string, isCctp?: boolean) => {
      const cctpWithdraw = () => {
        return new Promise<string>((resolve, reject) => {
          abacusStateManager.cctpWithdraw((success, error, data) => {
            const parsedData = JSON.parse(data);
            // eslint-disable-next-line eqeqeq
            if (success && parsedData?.code == 0) {
              resolve(parsedData?.transactionHash);
            } else {
              reject(error);
            }
          });
        });
      };
      if (isCctp) {
        return cctpWithdraw();
      }

      if (!subaccountClient) {
        return undefined;
      }
      const tx = await sendSquidWithdrawFromSubaccount({ subaccountClient, amount, payload });
      return hashFromTx(tx?.hash);
    },
    [subaccountClient, sendSquidWithdrawFromSubaccount]
  );

  const adjustIsolatedMarginOfPosition = useCallback(
    ({
      onError,
      onSuccess,
    }: {
      onError?: (onErrorParams?: { errorStringKey?: Nullable<string> }) => void;
      onSuccess?: (
        subaccountTransferPayload?: Nullable<HumanReadableSubaccountTransferPayload>
      ) => void;
    }) => {
      const callback = (
        success: boolean,
        parsingError?: Nullable<ParsingError>,
        data?: Nullable<HumanReadableSubaccountTransferPayload>
      ) => {
        if (success) {
          onSuccess?.(data);
        } else {
          onError?.({ errorStringKey: parsingError?.stringKey });
        }
      };

      const subaccountTransferPayload = abacusStateManager.adjustIsolatedMarginOfPosition(callback);
      return subaccountTransferPayload;
    },
    []
  );

  // ------ Faucet Methods ------ //
  const requestFaucetFunds = useCallback(async () => {
    try {
      if (!dydxAddress) throw new Error('dydxAddress is not connected');

      await Promise.all([
        getFaucetFunds({ dydxAddress, subaccountNumber }),
        getNativeTokens({ dydxAddress }),
      ]);
    } catch (error) {
      log('useSubaccount/getFaucetFunds', error);
      throw error;
    }
  }, [dydxAddress, getFaucetFunds, getNativeTokens, subaccountNumber]);

  // ------ Trading Methods ------ //
  const placeOrder = useCallback(
    ({
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
            dispatch(
              placeOrderFailed({
                clientId: data.clientId,
                errorStringKey: parsingError?.stringKey ?? STRING_KEYS.SOMETHING_WENT_WRONG,
              })
            );
          }
        }
      };

      let placeOrderParams;

      if (isClosePosition) {
        placeOrderParams = abacusStateManager.closePosition(callback);
      } else {
        placeOrderParams = abacusStateManager.placeOrder(callback);
      }

      if (placeOrderParams?.clientId) {
        dispatch(
          placeOrderSubmitted({
            marketId: placeOrderParams.marketId,
            clientId: placeOrderParams.clientId,
            orderType: placeOrderParams.type as TradeTypes,
          })
        );
      }

      return placeOrderParams;
    },
    [dispatch]
  );

  const closePosition = useCallback(
    ({
      onError,
      onSuccess,
    }: {
      onError: (onErrorParams?: { errorStringKey?: Nullable<string> }) => void;
      onSuccess?: (placeOrderPayload: Nullable<HumanReadablePlaceOrderPayload>) => void;
    }) => placeOrder({ isClosePosition: true, onError, onSuccess }),
    [placeOrder]
  );

  const cancelOrder = useCallback(
    ({
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
          dispatch(cancelOrderConfirmed(orderId));
          onSuccess?.();
        } else {
          dispatch(
            cancelOrderFailed({
              orderId,
              errorStringKey: parsingError?.stringKey ?? STRING_KEYS.SOMETHING_WENT_WRONG,
            })
          );
          onError?.({ errorStringKey: parsingError?.stringKey });
        }
      };

      dispatch(cancelOrderSubmitted(orderId));
      abacusStateManager.cancelOrder(orderId, callback);
    },
    [dispatch]
  );

  // ------ Trigger Orders Methods ------ //
  const placeTriggerOrders = useCallback(
    async ({
      onError,
      onSuccess,
    }: {
      onError?: (onErrorParams?: { errorStringKey?: Nullable<string> }) => void;
      onSuccess?: () => void;
    } = {}) => {
      const callback = (
        success: boolean,
        parsingError?: Nullable<ParsingError>,
        data?: Nullable<HumanReadableTriggerOrdersPayload>
      ) => {
        const placeOrderPayloads = data?.placeOrderPayloads.toArray() ?? [];
        const cancelOrderPayloads = data?.cancelOrderPayloads.toArray() ?? [];

        if (success) {
          onSuccess?.();

          cancelOrderPayloads.forEach((payload: HumanReadableCancelOrderPayload) => {
            dispatch(cancelOrderConfirmed(payload.orderId));
          });
        } else {
          onError?.({ errorStringKey: parsingError?.stringKey });

          placeOrderPayloads.forEach((payload: HumanReadablePlaceOrderPayload) => {
            dispatch(
              placeOrderFailed({
                clientId: payload.clientId,
                errorStringKey: parsingError?.stringKey ?? STRING_KEYS.SOMETHING_WENT_WRONG,
              })
            );
          });

          cancelOrderPayloads.forEach((payload: HumanReadableCancelOrderPayload) => {
            dispatch(
              cancelOrderFailed({
                orderId: payload.orderId,
                errorStringKey: parsingError?.stringKey ?? STRING_KEYS.SOMETHING_WENT_WRONG,
              })
            );
          });
        }
      };

      const triggerOrderParams = abacusStateManager.triggerOrders(callback);

      triggerOrderParams?.placeOrderPayloads
        .toArray()
        .forEach((payload: HumanReadablePlaceOrderPayload) => {
          dispatch(
            placeOrderSubmitted({
              marketId: payload.marketId,
              clientId: payload.clientId,
              orderType: payload.type as TradeTypes,
            })
          );
        });

      triggerOrderParams?.cancelOrderPayloads
        .toArray()
        .forEach((payload: HumanReadableCancelOrderPayload) => {
          dispatch(cancelOrderSubmitted(payload.orderId));
        });

      return triggerOrderParams;
    },
    [dispatch]
  );

  const { newMarketProposal } = useGovernanceVariables();

  // ------ Governance Methods ------ //
  const submitNewMarketProposal = useCallback(
    async (params: GovAddNewMarketParams) => {
      if (!compositeClient) {
        throw new Error('client not initialized');
      } else if (!localDydxWallet) {
        throw new Error('wallet not initialized');
      } else if (!newMarketProposal) {
        throw new Error('governance variables not initialized');
      }

      const response = await compositeClient.submitGovAddNewMarketProposal(
        localDydxWallet,
        params,
        utils.getGovAddNewMarketTitle(params.ticker),
        utils.getGovAddNewMarketSummary(params.ticker, newMarketProposal.delayBlocks),
        BigInt(newMarketProposal.initialDepositAmount).toString(),
        undefined,
        undefined,
        true
      );

      return response;
    },
    [compositeClient, localDydxWallet, newMarketProposal]
  );

  // ------ Staking Methods ------ //
  const delegate = useCallback(
    async (validator: string, amount: number) => {
      if (!compositeClient) {
        throw new Error('client not initialized');
      }
      if (!subaccountClient?.wallet?.address) {
        throw new Error('wallet not initialized');
      }

      const response = await compositeClient?.validatorClient.post.delegate(
        subaccountClient,
        subaccountClient.wallet?.address,
        validator,
        parseUnits(amount.toString(), chainTokenDecimals).toString()
      );

      return response;
    },
    [subaccountClient, compositeClient, chainTokenDecimals]
  );

  const getDelegateFee = useCallback(
    async (validator: string, amount: number) => {
      if (!compositeClient) {
        throw new Error('client not initialized');
      }
      if (!localDydxWallet?.address) {
        throw new Error('wallet not initialized');
      }

      const tx = await compositeClient.simulate(
        localDydxWallet,
        () =>
          Promise.resolve([
            compositeClient.validatorClient.post.delegateMsg(
              localDydxWallet.address ?? '',
              validator,
              parseUnits(amount.toString(), chainTokenDecimals).toString()
            ),
          ]),
        compositeClient.validatorClient.post.defaultDydxGasPrice
      );

      return tx;
    },
    [localDydxWallet, compositeClient, chainTokenDecimals]
  );

  const undelegate = useCallback(
    async (amounts: Record<string, number | undefined>) => {
      if (!compositeClient) {
        throw new Error('client not initialized');
      }
      if (!localDydxWallet) {
        throw new Error('wallet not initialized');
      }

      const msgs = Object.keys(amounts)
        .map((validator) => {
          const amount = amounts[validator];
          if (!amount) {
            return undefined;
          }
          return compositeClient.validatorClient.post.undelegateMsg(
            localDydxWallet.address ?? '',
            validator,
            parseUnits(amount.toString(), chainTokenDecimals).toString()
          );
        })
        .filter(isTruthy);

      const tx = await compositeClient.send(
        localDydxWallet,
        () => Promise.resolve(msgs),
        false,
        compositeClient.validatorClient.post.defaultDydxGasPrice
      );

      return tx;
    },
    [localDydxWallet, compositeClient, chainTokenDecimals]
  );

  const getUndelegateFee = useCallback(
    async (amounts: Record<string, number | undefined>) => {
      if (!compositeClient) {
        throw new Error('client not initialized');
      }
      if (!localDydxWallet) {
        throw new Error('wallet not initialized');
      }

      const msgs = Object.keys(amounts)
        .map((validator) => {
          const amount = amounts[validator];
          if (!amount) {
            return undefined;
          }
          return compositeClient.validatorClient.post.undelegateMsg(
            localDydxWallet.address ?? '',
            validator,
            parseUnits(amount.toString(), chainTokenDecimals).toString()
          );
        })
        .filter(isTruthy);

      const tx = await compositeClient.simulate(
        localDydxWallet,
        () => Promise.resolve(msgs),
        compositeClient.validatorClient.post.defaultDydxGasPrice
      );

      return tx;
    },
    [localDydxWallet, compositeClient, chainTokenDecimals]
  );

  const withdrawReward = useCallback(
    async (validators: string[]) => {
      if (!compositeClient) {
        throw new Error('client not initialized');
      }
      if (!localDydxWallet) {
        throw new Error('wallet not initialized');
      }

      const msgs = validators
        .map((validator) => {
          return compositeClient.validatorClient.post.withdrawDelegatorRewardMsg(
            localDydxWallet.address ?? '',
            validator
          );
        })
        .filter(isTruthy);

      const tx = await compositeClient.send(
        localDydxWallet,
        () => Promise.resolve(msgs),
        false,
        compositeClient.validatorClient.post.defaultGasPrice
      );

      return tx;
    },
    [localDydxWallet, compositeClient]
  );

  const getWithdrawRewardFee = useCallback(
    async (validators: string[]) => {
      if (!compositeClient) {
        throw new Error('client not initialized');
      }
      if (!localDydxWallet) {
        throw new Error('wallet not initialized');
      }

      const msgs = validators
        .map((validator) => {
          return compositeClient.validatorClient.post.withdrawDelegatorRewardMsg(
            localDydxWallet.address ?? '',
            validator
          );
        })
        .filter(isTruthy);

      const tx = await compositeClient.simulate(
        localDydxWallet,
        () => Promise.resolve(msgs),
        compositeClient.validatorClient.post.defaultGasPrice
      );

      return tx;
    },
    [localDydxWallet, compositeClient]
  );

  return {
    // Deposit/Withdraw/Faucet Methods
    deposit,
    withdraw,
    requestFaucetFunds,

    // Transfer Methods
    transfer,
    sendSquidWithdraw,
    adjustIsolatedMarginOfPosition,

    // Trading Methods
    placeOrder,
    closePosition,
    cancelOrder,
    placeTriggerOrders,

    // Governance Methods
    submitNewMarketProposal,

    // Staking methods
    delegate,
    getDelegateFee,
    undelegate,
    getUndelegateFee,
    withdrawReward,
    getWithdrawRewardFee,
  };
};
