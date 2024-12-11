interface SubaccountSummaryBase {
  quoteBalance: number;
  notionalTotal: number;

  freeCollateral: number;
  equity: number;

  initialRiskTotal: number;
  leverage: number;
  marginUsage: number;
}

interface SubaccountSummary {}

interface GroupedSubaccountSummary {}
