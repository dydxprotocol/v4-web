import { AbacusMarginMode } from '@/constants/abacus';

import { MustBigNumber } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

import { getCurrentMarketPositionData } from './accountSelectors';
import { createAppSelector } from './appTypes';
import { getCurrentInput, getInputClosePositionData } from './inputsSelectors';

export const getIsClosingIsolatedMarginPosition = createAppSelector(
  [getCurrentInput, getInputClosePositionData, getCurrentMarketPositionData],
  (currentInput, closePositionInput, position) => {
    const { size } = orEmptyObj(closePositionInput);
    const { marginMode } = orEmptyObj(position);

    return (
      currentInput === 'closePosition' &&
      MustBigNumber(size?.size).abs().gt(0) &&
      marginMode === AbacusMarginMode.Isolated
    );
  }
);
