import { LAMPORTS_PER_SOL } from '@solana/web3.js';

import { SpotWalletStatus } from '@/constants/account';
import { MIN_SOL_RESERVE } from '@/constants/spot';

import { SpotApiCreateTransactionRequest, SpotApiSide, SpotApiTradeRoute } from '@/clients/spotApi';
import { calc, mapIfPresent } from '@/lib/do';
import { AttemptNumber, MustNumber } from '@/lib/numbers';

import { createForm, createVanillaReducer } from '../lib/forms';
import { ErrorType, simpleValidationError, ValidationError } from '../lib/validationErrors';

export enum SpotSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum SpotBuyInputType {
  USD = 'USD',
  SOL = 'SOL',
}

export enum SpotSellInputType {
  PERCENT = 'PERCENT',
  USD = 'USD',
}

export interface SpotFormState {
  side: SpotSide;
  buyInputType: SpotBuyInputType;
  sellInputType: SpotSellInputType;
  size: string;
}

const initialState: SpotFormState = {
  side: SpotSide.BUY,
  buyInputType: SpotBuyInputType.USD,
  sellInputType: SpotSellInputType.PERCENT,
  size: '',
};

const reducer = createVanillaReducer({
  initialState,
  actions: {
    setSide: (state, side: SpotSide) => ({
      ...state,
      side,
      size: '', // Clear size when switching side
    }),
    setBuyInputType: (state, buyInputType: SpotBuyInputType) => ({
      ...state,
      buyInputType,
    }),
    setSellInputType: (state, sellInputType: SpotSellInputType) => ({
      ...state,
      sellInputType,
    }),
    setSize: (state, size: string) => ({
      ...state,
      size,
    }),
    reset: () => initialState,
  },
});

export interface SpotFormInputData {
  tokenPriceUsd: number | undefined;
  solPriceUsd: number | undefined;
  userSolBalance: number | undefined;
  userTokenBalance: number | undefined;
  tokenMint: string | undefined;
  decimals: number | undefined;
  pairAddress: string | undefined;
  tradeRoute: SpotApiTradeRoute | undefined;
  solanaAddress: string | undefined;
  isReady: boolean;
  isAsyncDataReady: boolean;
  isRestReady: boolean;
  walletStatus: SpotWalletStatus;
}

export interface SpotAmounts {
  sol: number;
  token: number;
  usd: number;
  percent: number | undefined;
}

export interface SpotSummaryData {
  amounts: SpotAmounts | undefined;
  payload: SpotApiCreateTransactionRequest | undefined;
}

function calculateSummary(state: SpotFormState, inputData: SpotFormInputData): SpotSummaryData {
  const parsedSize = AttemptNumber(state.size);

  const amounts: SpotAmounts | undefined = calc(() =>
    mapIfPresent(
      parsedSize,
      inputData.tokenPriceUsd,
      inputData.solPriceUsd,
      (size, tokenUsdPrice, solUsdPrice): SpotAmounts => {
        if (state.side === SpotSide.BUY) {
          if (state.buyInputType === SpotBuyInputType.SOL) {
            const sol = size;
            const usd = sol * solUsdPrice;
            const token = usd / tokenUsdPrice;
            return { sol, usd, token, percent: undefined };
          }

          const usd = size;
          const sol = usd / solUsdPrice;
          const token = usd / tokenUsdPrice;
          return { sol, usd, token, percent: undefined };
        }

        if (state.sellInputType === SpotSellInputType.USD) {
          const usd = size;
          const sol = usd / solUsdPrice;
          const token = usd / tokenUsdPrice;
          const percent =
            inputData.userTokenBalance != null && inputData.userTokenBalance > 0
              ? (token / inputData.userTokenBalance) * 100
              : undefined;
          return { sol, usd, token, percent };
        }

        const percent = size;
        const token = (percent / 100) * (inputData.userTokenBalance ?? 0);
        const usd = token * tokenUsdPrice;
        const sol = usd / solUsdPrice;
        return { sol, usd, token, percent };
      }
    )
  );

  const payload = calc((): SpotApiCreateTransactionRequest | undefined => {
    if (state.side === SpotSide.BUY) {
      return mapIfPresent(
        amounts?.sol,
        inputData.tokenMint,
        inputData.solanaAddress,
        inputData.pairAddress,
        inputData.tradeRoute,
        (solAmount, tokenMint, solanaAddress, pairAddress, tradeRoute) => {
          const inAmount = Math.floor(solAmount * LAMPORTS_PER_SOL).toString();
          return {
            account: solanaAddress,
            tokenMint,
            side: SpotApiSide.BUY,
            inAmount,
            pool: pairAddress,
            tradeRoute,
          };
        }
      );
    }

    return mapIfPresent(
      amounts?.token,
      inputData.tokenMint,
      inputData.solanaAddress,
      inputData.pairAddress,
      inputData.tradeRoute,
      inputData.decimals,
      (tokenAmount, tokenMint, solanaAddress, pairAddress, tradeRoute, decimals) => {
        const inAmount = Math.floor(tokenAmount * decimals).toString();
        return {
          account: solanaAddress,
          tokenMint,
          side: SpotApiSide.SELL,
          inAmount,
          pool: pairAddress,
          tradeRoute,
        };
      }
    );
  });

  return { amounts, payload };
}

export function getErrors(
  state: SpotFormState,
  inputData: SpotFormInputData,
  summary: SpotSummaryData
): ValidationError[] {
  const validationErrors: ValidationError[] = [];

  if (inputData.walletStatus === SpotWalletStatus.Disconnected) {
    validationErrors.push(
      simpleValidationError({
        code: 'SPOT_WALLET_DISCONNECTED',
        type: ErrorType.error,
        titleFallback: 'Connect Wallet',
      })
    );
    return validationErrors;
  }

  if (inputData.walletStatus === SpotWalletStatus.Unsupported) {
    validationErrors.push(
      simpleValidationError({
        code: 'SPOT_WALLET_UNSUPPORTED',
        type: ErrorType.error,
        titleFallback: 'Unsupported Wallet',
        textFallback: 'Spot trading requires an EVM or Solana wallet',
      })
    );
    return validationErrors;
  }

  const parsedSize = AttemptNumber(state.size);

  if (parsedSize == null || parsedSize <= 0) {
    validationErrors.push(
      simpleValidationError({
        code: 'SPOT_AMOUNT_EMPTY',
        type: ErrorType.error,
        fields: ['size'],
        titleFallback: 'Enter Amount',
      })
    );
    return validationErrors;
  }

  if (
    inputData.userSolBalance == null ||
    inputData.tokenPriceUsd == null ||
    inputData.solPriceUsd == null ||
    inputData.tokenMint == null ||
    inputData.pairAddress == null ||
    inputData.tradeRoute == null ||
    inputData.solanaAddress == null ||
    inputData.decimals == null ||
    !inputData.isAsyncDataReady
  ) {
    validationErrors.push(
      simpleValidationError({
        code: 'SPOT_MISSING_DATA',
        type: ErrorType.error,
        titleFallback: 'Missing Data',
        textFallback: 'Market data is loading. Please wait...',
      })
    );
    return validationErrors;
  }

  if (state.side === SpotSide.BUY) {
    const requiredSol = MustNumber(summary.amounts?.sol);
    const availableSol = inputData.userSolBalance;

    if (requiredSol > availableSol) {
      validationErrors.push(
        simpleValidationError({
          code: 'SPOT_INSUFFICIENT_SOL',
          type: ErrorType.error,
          fields: ['size'],
          titleFallback: 'Insufficient Balance',
          textFallback: 'Insufficient SOL balance for this purchase',
        })
      );
    }

    if (availableSol - requiredSol < MIN_SOL_RESERVE) {
      validationErrors.push(
        simpleValidationError({
          code: 'SPOT_LOW_SOL_FOR_FEES',
          type: ErrorType.warning,
          titleFallback: 'Low SOL Balance',
          textFallback:
            'After this trade, your remaining SOL may be insufficient for future transaction fees',
        })
      );
    }
  } else {
    const requiredToken = MustNumber(summary.amounts?.token);
    const availableToken = MustNumber(inputData.userTokenBalance);
    const sellPercentage = MustNumber(summary.amounts?.percent);

    if (requiredToken > availableToken) {
      validationErrors.push(
        simpleValidationError({
          code: 'SPOT_INSUFFICIENT_TOKEN',
          type: ErrorType.error,
          fields: ['size'],
          titleFallback: 'Insufficient Balance',
          textFallback: 'Insufficient token balance for this trade',
        })
      );
    }

    if (state.sellInputType === SpotSellInputType.PERCENT && sellPercentage > 100) {
      validationErrors.push(
        simpleValidationError({
          code: 'SPOT_PERCENT_TOO_HIGH',
          type: ErrorType.error,
          fields: ['size'],
          titleFallback: 'Invalid Percent',
          textFallback: 'Percent must be 100 or less',
        })
      );
    }

    if (inputData.userSolBalance < MIN_SOL_RESERVE) {
      validationErrors.push(
        simpleValidationError({
          code: 'SPOT_LOW_SOL_FOR_FEES',
          type: ErrorType.warning,
          titleFallback: 'Low SOL Balance',
          textFallback: 'Your SOL balance may be insufficient for transaction fees',
        })
      );
    }
  }

  return validationErrors;
}

export const SpotFormFns = createForm({
  reducer,
  calculateSummary,
  getErrors,
});
