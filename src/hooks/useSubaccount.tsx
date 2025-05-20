import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { accountTransactionManager } from '@/bonsai/AccountTransactionSupervisor';
import { SubaccountTransferPayload } from '@/bonsai/forms/adjustIsolatedMargin';
import { TransferPayload, TransferToken } from '@/bonsai/forms/transfers';
import { TriggerOrdersPayload } from '@/bonsai/forms/triggers/types';
import { wrapOperationFailure, wrapOperationSuccess } from '@/bonsai/lib/operationResult';
import { logBonsaiError, logBonsaiInfo } from '@/bonsai/logs';
import { BonsaiCore } from '@/bonsai/ontology';
import type { EncodeObject } from '@cosmjs/proto-signing';
import { Method } from '@cosmjs/tendermint-rpc';
import { SubaccountClient, type LocalWallet } from '@dydxprotocol/v4-client-js';
import { useMutation } from '@tanstack/react-query';
import Long from 'long';
import { formatUnits, parseUnits } from 'viem';

import { AMOUNT_RESERVED_FOR_GAS_USDC, AMOUNT_USDC_BEFORE_REBALANCE } from '@/constants/account';
import { AnalyticsEvents, DEFAULT_TRANSACTION_MEMO, TransactionMemo } from '@/constants/analytics';
import { DialogTypes } from '@/constants/dialogs';
import { QUANTUM_MULTIPLIER } from '@/constants/numbers';
import { USDC_DECIMALS } from '@/constants/tokens';
import { DydxAddress, WalletType } from '@/constants/wallets';

import { removeLatestReferrer } from '@/state/affiliates';
import { getLatestReferrer } from '@/state/affiliatesSelector';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';
import { clearLocalOrders } from '@/state/localOrders';

import { track } from '@/lib/analytics/analytics';
import { assertNever } from '@/lib/assertNever';
import { stringifyTransactionError } from '@/lib/errors';
import { isTruthy } from '@/lib/isTruthy';
import { parseToPrimitives } from '@/lib/parseToPrimitives';
import { log } from '@/lib/telemetry';

import { useAccounts } from './useAccounts';
import { useDydxClient } from './useDydxClient';
import { useReferredBy } from './useReferredBy';
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
  const { sourceAccount } = useAccounts();
  const { compositeClient, faucetClient } = useDydxClient();

  const isKeplr = sourceAccount.walletInfo?.name === WalletType.Keplr;

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

  const { depositToSubaccount, withdrawFromSubaccount } = useMemo(
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
            amount.toFixed(usdcDecimals),
            TransactionMemo.depositToSubaccount
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
            amount.toFixed(usdcDecimals),
            undefined,
            TransactionMemo.withdrawFromSubaccount
          );
        } catch (error) {
          log('useSubaccount/withdrawFromSubaccount', error);
          throw error;
        }
      },

      sendSkipWithdrawFromSubaccount: async ({
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
                ? // Signer expects BigInt but the payload types the value as string
                  BigInt(Long.fromValue(transaction.msg.timeoutTimestamp).toString())
                : undefined,
            },
          };

          return await compositeClient.send(
            subaccountClient.wallet,
            () => Promise.resolve([msg, ibcMsg]),
            false,
            undefined,
            TransactionMemo.withdrawFromAccount
          );
        } catch (error) {
          // Reset the default options after the tx is sent.
          if (isKeplr && window.keplr) {
            window.keplr.defaultOptions = {};
          }
          log('useSubaccount/sendSkipWithdrawFromSubaccount', error);
          throw error;
        }
      },
    }),
    [compositeClient, isKeplr, usdcDecimals]
  );

  const [subaccountNumber] = useState(0);

  const subaccountClient = useMemo(
    () => (localDydxWallet ? new SubaccountClient(localDydxWallet, subaccountNumber) : undefined),
    [localDydxWallet, subaccountNumber]
  );

  const dydxAddress = localDydxWallet?.address as DydxAddress | undefined;

  useEffect(() => {
    dispatch(clearLocalOrders());
  }, [dispatch, dydxAddress]);

  // ------ Deposit/Withdraw Methods ------ //
  const balances = useAppSelector(BonsaiCore.account.balances.data);
  const usdcCoinBalance = balances.usdcAmount;

  const [showDepositDialog, setShowDepositDialog] = useState(true);

  useEffect(() => {
    if (isKeplr && usdcCoinBalance) {
      if (showDepositDialog) {
        const balanceAmount = parseFloat(usdcCoinBalance);
        const usdcBalance = balanceAmount - AMOUNT_RESERVED_FOR_GAS_USDC;
        const shouldDeposit = usdcBalance > 0 && usdcBalance.toFixed(2) !== '0.00';
        if (shouldDeposit) {
          dispatch(
            openDialog(
              DialogTypes.ConfirmPendingDeposit({
                usdcBalance,
              })
            )
          );
        }
      }
      setShowDepositDialog(false);
    }
  }, [isKeplr, usdcCoinBalance, showDepositDialog, dispatch]);

  const deposit = useCallback(
    async (amount: number) => {
      if (!subaccountClient) {
        return undefined;
      }

      return depositToSubaccount({ subaccountClient, amount });
    },
    [subaccountClient, depositToSubaccount]
  );

  const depositCurrentBalance = useCallback(async () => {
    const currentBalance = (
      await compositeClient?.validatorClient.get.getAccountBalance(dydxAddress as string, usdcDenom)
    )?.amount;

    if (!currentBalance) throw new Error('Failed to get current balance');

    const balanceAmount = formatUnits(BigInt(currentBalance), usdcDecimals);

    const depositAmount = parseFloat(balanceAmount) - AMOUNT_RESERVED_FOR_GAS_USDC;

    if (depositAmount > 0) {
      await deposit(depositAmount);
    }
  }, [usdcDecimals, compositeClient, dydxAddress, usdcDenom, deposit]);

  const withdraw = useCallback(
    async (amount: number, fromSubaccountNumber: number) => {
      if (!localDydxWallet) {
        return undefined;
      }
      const subaccountClientForWithdraw = new SubaccountClient(
        localDydxWallet,
        fromSubaccountNumber
      );

      return withdrawFromSubaccount({ subaccountClient: subaccountClientForWithdraw, amount });
    },
    [localDydxWallet, withdrawFromSubaccount]
  );

  // ------ Transfer Methods ------ //

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

  // ------ Trigger Orders Methods ------ //
  const placeTriggerOrders = useCallback(async (payload: TriggerOrdersPayload) => {
    return accountTransactionManager.placeCompoundOrder({
      orderPayload: undefined,
      triggersPayloads: payload.payloads,
    });
  }, []);

  // ------ Listing Method ------ //
  const createPermissionlessMarket = useCallback(
    async (ticker: string) => {
      if (!compositeClient) {
        throw new Error('client not initialized');
      } else if (!subaccountClient?.address) {
        throw new Error('wallet not initialized');
      }

      track(AnalyticsEvents.LaunchMarketTransaction({ marketId: ticker }));

      const response = await compositeClient.createMarketPermissionless(
        subaccountClient,
        ticker,
        undefined,
        undefined,
        TransactionMemo.launchMarket
      );

      return response;
    },
    [compositeClient, subaccountClient]
  );

  // ------ Staking Methods ------ //
  const delegate = useCallback(
    async (validator: string, amount: number) => {
      if (!compositeClient) {
        throw new Error('client not initialized');
      }
      if (!subaccountClient?.wallet.address) {
        throw new Error('wallet not initialized');
      }

      const response = await compositeClient.validatorClient.post.delegate(
        subaccountClient,
        subaccountClient.wallet.address,
        validator,
        parseUnits(amount.toString(), chainTokenDecimals).toString(),
        Method.BroadcastTxCommit
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
        compositeClient.validatorClient.post.defaultDydxGasPrice,
        undefined,
        Method.BroadcastTxCommit
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
        compositeClient.validatorClient.post.defaultGasPrice,
        undefined,
        Method.BroadcastTxCommit
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

  const registerAffiliate = useCallback(
    async (affiliate: string) => {
      if (!compositeClient) {
        throw new Error('client not initialized');
      }
      if (!subaccountClient?.wallet.address) {
        throw new Error('wallet not initialized');
      }
      if (affiliate === subaccountClient.wallet.address) {
        throw new Error('affiliate can not be the same as referree');
      }
      try {
        const response = await compositeClient.validatorClient.post.registerAffiliate(
          subaccountClient,
          affiliate
        );
        return response;
      } catch (error) {
        log('useSubaccount/registerAffiliate', error);
        throw error;
      }
    },
    [subaccountClient, compositeClient]
  );

  const latestReferrer = useAppSelector(getLatestReferrer);
  const { data: referredBy, isFetched: isReferredByFetched } = useReferredBy();

  const { mutateAsync: registerAffiliateMutate, isPending: isRegisterAffiliatePending } =
    useMutation({
      mutationFn: async (affiliateAddress: string) => {
        const tx = await registerAffiliate(affiliateAddress);
        dispatch(removeLatestReferrer());
        track(AnalyticsEvents.AffiliateRegistration({ affiliateAddress }));
        return tx;
      },
    });

  useEffect(() => {
    if (!subaccountClient) return;

    if (dydxAddress === latestReferrer) {
      dispatch(removeLatestReferrer());
      return;
    }
    if (
      compositeClient &&
      latestReferrer &&
      dydxAddress &&
      usdcCoinBalance &&
      parseFloat(usdcCoinBalance) > AMOUNT_USDC_BEFORE_REBALANCE &&
      isReferredByFetched &&
      !referredBy?.affiliateAddress &&
      !isRegisterAffiliatePending
    ) {
      registerAffiliateMutate(latestReferrer);
    }
  }, [
    compositeClient,
    latestReferrer,
    dydxAddress,
    registerAffiliateMutate,
    usdcCoinBalance,
    subaccountClient,
    isReferredByFetched,
    referredBy?.affiliateAddress,
    dispatch,
    isRegisterAffiliatePending,
  ]);

  useEffect(() => {
    if (referredBy?.affiliateAddress && latestReferrer) {
      dispatch(removeLatestReferrer());
    }
  }, [referredBy?.affiliateAddress, dispatch, latestReferrer]);

  const getVaultAccountInfo = useCallback(async () => {
    if (!compositeClient?.validatorClient) {
      throw new Error('client not initialized');
    }
    if (!dydxAddress) throw new Error('dydxAddress is not connected');
    const result = await compositeClient.validatorClient.get.getMegavaultOwnerShares(dydxAddress);
    if (result == null) {
      return result;
    }
    return parseToPrimitives(result);
  }, [compositeClient?.validatorClient, dydxAddress]);

  const depositToMegavault = useCallback(
    async (amount: number) => {
      if (!compositeClient) {
        throw new Error('client not initialized');
      }
      if (subaccountClient == null) {
        throw new Error('local wallet client not initialized');
      }

      return compositeClient.depositToMegavault(subaccountClient, amount, Method.BroadcastTxCommit);
    },
    [compositeClient, subaccountClient]
  );

  const withdrawFromMegavault = useCallback(
    async (shares: number, minAmount: number) => {
      if (!compositeClient) {
        throw new Error('client not initialized');
      }
      if (subaccountClient == null) {
        throw new Error('local wallet client not initialized');
      }
      return compositeClient.withdrawFromMegavault(
        subaccountClient,
        shares,
        minAmount,
        Method.BroadcastTxCommit
      );
    },
    [compositeClient, subaccountClient]
  );

  const transferBetweenSubaccounts = useCallback(
    async (params: SubaccountTransferPayload, memo?: string) => {
      try {
        const subaccount = localDydxWallet
          ? new SubaccountClient(localDydxWallet, params.subaccountNumber)
          : undefined;

        if (subaccount == null) {
          throw new Error('local wallet client not initialized');
        }

        if (!compositeClient) {
          throw new Error('Missing compositeClient or localWallet');
        }

        if (params.senderAddress !== subaccount.address) {
          throw new Error('Sender address does not match local wallet');
        }

        const tx = await compositeClient.transferToSubaccount(
          subaccount,
          params.destinationAddress,
          params.destinationSubaccountNumber,
          parseFloat(params.amount).toFixed(USDC_DECIMALS),
          memo ?? DEFAULT_TRANSACTION_MEMO
        );

        const parsedTx = parseToPrimitives(tx);
        logBonsaiInfo('useSubaccount/subaccountTransfer', 'Successful subaccount transfer', {
          parsedTx,
        });
        return wrapOperationSuccess(parsedTx);
      } catch (error) {
        const parsed = stringifyTransactionError(error);
        logBonsaiError('useSubaccount/subaccountTransfer', 'Failed subaccount transfer', {
          parsed,
        });
        return wrapOperationFailure(parsed);
      }
    },
    [compositeClient, localDydxWallet]
  );

  const createTransferMessage = useCallback(
    (payload: TransferPayload) => {
      if (subaccountClient == null) {
        throw new Error('local wallet client not initialized');
      }

      if (compositeClient == null) {
        throw new Error('Missing compositeClient or localWallet');
      }

      if (payload.type === TransferToken.USDC) {
        return compositeClient.validatorClient.post.composer.composeMsgWithdrawFromSubaccount(
          subaccountClient.address,
          subaccountClient.subaccountNumber,
          0, // assetId default
          Long.fromNumber(payload.amount * QUANTUM_MULTIPLIER),
          payload.recipient
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (payload.type === TransferToken.NATIVE) {
        return compositeClient.sendTokenMessage(
          subaccountClient.wallet,
          payload.amount.toString(),
          payload.recipient
        );
      }
      assertNever(payload);
      return undefined;
    },
    [compositeClient, subaccountClient]
  );

  const simulateTransfer = useCallback(
    async (payload: TransferPayload) => {
      try {
        if (subaccountClient == null) {
          throw new Error('local wallet client not initialized');
        }

        if (compositeClient == null) {
          throw new Error('Missing compositeClient or localWallet');
        }

        const gasPrice =
          payload.type === TransferToken.USDC
            ? undefined
            : compositeClient.validatorClient.post.defaultDydxGasPrice;

        const message = createTransferMessage(payload);

        if (message == null) {
          throw new Error('invalid message generated');
        }

        const tx = await compositeClient.simulate(
          subaccountClient.wallet,
          () => Promise.resolve([message]),
          gasPrice
        );

        const parsedTx = parseToPrimitives(tx);
        logBonsaiInfo('useSubaccount/simulateTransfer', 'Successful transfer simulation', {
          payload,
          parsedTx,
        });
        return wrapOperationSuccess(parsedTx);
      } catch (error) {
        const parsed = stringifyTransactionError(error);
        logBonsaiError('useSubaccount/simulateTransfer', 'Failed transfer simulation', {
          transferType: payload.type,
          parsed,
        });
        return wrapOperationFailure(parsed);
      }
    },
    [subaccountClient, compositeClient, createTransferMessage]
  );

  const transfer = useCallback(
    async (payload: TransferPayload) => {
      try {
        if (subaccountClient == null) {
          throw new Error('local wallet client not initialized');
        }

        if (compositeClient == null) {
          throw new Error('Missing compositeClient or localWallet');
        }

        const transferMemo =
          payload.type === TransferToken.USDC
            ? `${DEFAULT_TRANSACTION_MEMO} | transfer usdc to ${subaccountClient.address}`
            : payload.memo;

        const gasPrice =
          payload.type === TransferToken.USDC
            ? undefined
            : compositeClient.validatorClient.post.defaultDydxGasPrice;

        const message = createTransferMessage(payload);

        if (message == null) {
          throw new Error('invalid message generated');
        }

        const result = await compositeClient.validatorClient.post.send(
          subaccountClient.wallet,
          () => Promise.resolve([message]),
          false,
          gasPrice,
          transferMemo,
          Method.BroadcastTxCommit
        );

        const parsedResult = parseToPrimitives(result);
        logBonsaiInfo('useSubaccount/transfer', 'Successful transfer', {
          transferType: payload.type,
          parsedResult,
        });

        return wrapOperationSuccess(parsedResult);
      } catch (error) {
        const parsed = stringifyTransactionError(error);
        logBonsaiError('useSubaccount/transfer', 'Failed transfer', {
          transferType: payload.type,
          parsed,
        });

        return wrapOperationFailure(parsed);
      }
    },
    [subaccountClient, compositeClient, createTransferMessage]
  );

  return {
    // Deposit/Withdraw/Faucet Methods
    deposit,
    withdraw,
    requestFaucetFunds,

    // Transfer Methods
    transfer,
    simulateTransfer,
    depositCurrentBalance,
    transferBetweenSubaccounts,

    // Trading Methods
    placeTriggerOrders,

    // Listing Methods
    createPermissionlessMarket,

    // Staking methods
    delegate,
    getDelegateFee,
    undelegate,
    getUndelegateFee,
    withdrawReward,
    getWithdrawRewardFee,

    // affiliates
    registerAffiliate,
    referredBy: referredBy?.affiliateAddress,

    // vaults
    getVaultAccountInfo,
    depositToMegavault,
    withdrawFromMegavault,
  };
};
