// Mock data for offline testing
import type { MarketHistoricalFunding } from './abacus';
import { timeUnits } from './time';

export const mockHistoricalFundingData = Array.from(
  { length: 100 },
  (_, i) =>
    ({
      effectiveAtMilliseconds:
        timeUnits.hour * Math.floor(Date.now() / timeUnits.hour) - (100 - i - 1) * timeUnits.hour,
      rate: (Math.random() - 0.5) * 0.0001,
    }) as MarketHistoricalFunding
);

export const mockSubaccountPnlData = Array.from({ length: 3000 }, (_, i) => {
  const j = 3000 - i - 1;
  const netTransfers = 2000 + Math.floor(i / 150) * 1500 - Math.floor(i / 400) * 2500;

  const equity =
    (Math.random() - 0.5) * 400 +
    Math.sin(i * 0.5) * 200 +
    Math.sin(i * 0.08) * Math.cos(i * 0.18) * 500;

  const totalPnl = netTransfers + equity;

  return {
    id: i,
    subaccountId: 0,
    equity,
    totalPnl,
    netTransfers,
    createdAt: j ? timeUnits.hour * (Math.floor(Date.now() / timeUnits.hour) - j) : Date.now(),
  };
});
