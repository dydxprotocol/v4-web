import { calc } from '@/lib/do';
import { AttemptBigNumber } from '@/lib/numbers';

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
  SOL = 'SOL',
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

// Input data that will come from API or hardcoded sources
export interface SpotFormInputData {
  tokenSymbol: string;
  tokenPriceUsd: number | undefined; // Price of the token in USD
  solPriceUsd: number | undefined; // Price of SOL in USD
  userSolBalance: number | undefined; // User's SOL balance
  userTokenBalance: number | undefined; // User's token balance
}

// Payload that will be sent to the API
export interface SpotTradePayload {
  side: SpotSide;
  tokenSymbol: string;
  // For BUY orders
  solAmount?: number; // Amount of SOL to spend
  usdAmount?: number; // Amount of USD worth of SOL to spend
  // For SELL orders
  tokenAmount?: number; // Amount of token to sell
  sellPercent?: number; // Percentage of balance to sell
}

export interface SpotSummaryData {
  estimatedTokenAmount: number | undefined; // Estimated tokens to receive (BUY) or sell (SELL)
  estimatedSolCost: number | undefined; // Estimated SOL cost for the trade
  estimatedUsdCost: number | undefined; // Estimated USD value of the trade
  payload: SpotTradePayload | undefined;
}

function calculateSummary(state: SpotFormState, inputData: SpotFormInputData): SpotSummaryData {
  const parsedSize = AttemptBigNumber(state.size);

  // Calculate estimates based on input
  const { estimatedTokenAmount, estimatedSolCost, estimatedUsdCost } = calc(() => {
    if (!parsedSize || !inputData.tokenPriceUsd || !inputData.solPriceUsd) {
      return {
        estimatedTokenAmount: undefined,
        estimatedSolCost: undefined,
        estimatedUsdCost: undefined,
      };
    }

    if (state.side === SpotSide.BUY) {
      if (state.buyInputType === SpotBuyInputType.SOL) {
        // User entered SOL amount
        const solAmount = parsedSize.toNumber();
        const usdValue = solAmount * inputData.solPriceUsd;
        const tokenAmount = usdValue / inputData.tokenPriceUsd;

        return {
          estimatedTokenAmount: tokenAmount,
          estimatedSolCost: solAmount,
          estimatedUsdCost: usdValue,
        };
      }

      // User entered USD amount
      const usdValue = parsedSize.toNumber();
      const solAmount = usdValue / inputData.solPriceUsd;
      const tokenAmount = usdValue / inputData.tokenPriceUsd;

      return {
        estimatedTokenAmount: tokenAmount,
        estimatedSolCost: solAmount,
        estimatedUsdCost: usdValue,
      };
    }

    if (state.sellInputType === SpotSellInputType.SOL) {
      // User entered SOL amount to receive
      const solAmount = parsedSize.toNumber();
      const usdValue = solAmount * inputData.solPriceUsd;
      const tokenAmount = usdValue / inputData.tokenPriceUsd;

      return {
        estimatedTokenAmount: tokenAmount,
        estimatedSolCost: solAmount,
        estimatedUsdCost: usdValue,
      };
    }

    // User entered percentage
    const percent = parsedSize.toNumber();
    const tokenAmount = (percent / 100) * (inputData.userTokenBalance ?? 0);
    const usdValue = tokenAmount * inputData.tokenPriceUsd;
    const solAmount = usdValue / inputData.solPriceUsd;

    return {
      estimatedTokenAmount: tokenAmount,
      estimatedSolCost: solAmount,
      estimatedUsdCost: usdValue,
    };
  });

  // Build payload for API
  const payload = calc((): SpotTradePayload | undefined => {
    if (!parsedSize || parsedSize.lte(0) || !inputData.tokenPriceUsd || !inputData.solPriceUsd) {
      return undefined;
    }

    const basePayload = {
      side: state.side,
      tokenSymbol: inputData.tokenSymbol,
    };

    if (state.side === SpotSide.BUY) {
      if (state.buyInputType === SpotBuyInputType.SOL) {
        return {
          ...basePayload,
          solAmount: parsedSize.toNumber(),
        };
      }

      return {
        ...basePayload,
        usdAmount: parsedSize.toNumber(),
      };
    }

    if (state.sellInputType === SpotSellInputType.SOL) {
      return {
        ...basePayload,
        tokenAmount: estimatedTokenAmount,
      };
    }

    return {
      ...basePayload,
      sellPercent: parsedSize.toNumber(),
      tokenAmount: estimatedTokenAmount,
    };
  });

  return {
    estimatedTokenAmount,
    estimatedSolCost,
    estimatedUsdCost,
    payload,
  };
}

class SpotFormValidationErrors {
  sizeEmpty(): ValidationError {
    return simpleValidationError({
      code: 'SIZE_EMPTY',
      type: ErrorType.error,
      fields: ['size'],
    });
  }

  invalidSize(): ValidationError {
    return simpleValidationError({
      code: 'INVALID_SIZE',
      type: ErrorType.error,
      fields: ['size'],
    });
  }

  insufficientSolBalance(): ValidationError {
    return simpleValidationError({
      code: 'INSUFFICIENT_SOL_BALANCE',
      type: ErrorType.error,
      fields: ['size'],
    });
  }

  insufficientTokenBalance(): ValidationError {
    return simpleValidationError({
      code: 'INSUFFICIENT_TOKEN_BALANCE',
      type: ErrorType.error,
      fields: ['size'],
    });
  }

  invalidPercent(): ValidationError {
    return simpleValidationError({
      code: 'INVALID_PERCENT',
      type: ErrorType.error,
      fields: ['size'],
    });
  }

  missingPriceData(): ValidationError {
    return simpleValidationError({
      code: 'MISSING_PRICE_DATA',
      type: ErrorType.error,
    });
  }

  noPayload(): ValidationError {
    return simpleValidationError({
      code: 'MISSING_PAYLOAD',
      type: ErrorType.error,
    });
  }
}

const errors = new SpotFormValidationErrors();

export function getErrors(
  state: SpotFormState,
  inputData: SpotFormInputData,
  summary: SpotSummaryData
): ValidationError[] {
  const validationErrors: ValidationError[] = [];

  const size = AttemptBigNumber(state.size);

  // Check if size is empty or invalid
  if (size == null || size.lte(0)) {
    validationErrors.push(errors.sizeEmpty());
    return validationErrors; // Return early if size is invalid
  }

  // Check if price data is available
  if (!inputData.tokenPriceUsd || !inputData.solPriceUsd) {
    validationErrors.push(errors.missingPriceData());
    return validationErrors;
  }

  // Validate based on side and input type
  if (state.side === SpotSide.BUY) {
    // Check if user has sufficient SOL balance
    if (summary.estimatedSolCost != null && inputData.userSolBalance != null) {
      if (summary.estimatedSolCost > inputData.userSolBalance) {
        validationErrors.push(errors.insufficientSolBalance());
      }
    }
  } else if (state.side === SpotSide.SELL) {
    if (state.sellInputType === SpotSellInputType.PERCENT) {
      // Validate percentage is between 0 and 100
      const percent = size.toNumber();
      if (percent < 0 || percent > 100) {
        validationErrors.push(errors.invalidPercent());
      }
    }

    // Check if user has sufficient token balance
    if (summary.estimatedTokenAmount != null && inputData.userTokenBalance != null) {
      if (summary.estimatedTokenAmount > inputData.userTokenBalance) {
        validationErrors.push(errors.insufficientTokenBalance());
      }
    }
  }

  // Check if payload was generated
  if (!summary.payload) {
    validationErrors.push(errors.noPayload());
  }

  return validationErrors;
}

export const SpotFormFns = createForm({
  reducer,
  calculateSummary,
  getErrors,
});
