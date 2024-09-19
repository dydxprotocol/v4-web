import { BigNumber } from 'bignumber.js';

export const getLeverageOptionsForMaxLeverage = (maxLeverageBN: BigNumber) => {
  if (maxLeverageBN.lte(5)) {
    return [1, 2, 3, 4, 5];
  }
  if (maxLeverageBN.lte(10)) {
    return [1, 2, 3, 5, 10];
  }
  if (maxLeverageBN.lte(20)) {
    return [1, 5, 10, 15, 20];
  }
  return [1, 10, 25, 50, 100];
};
