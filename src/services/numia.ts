type GetChainRevenueRequest = {
  startDate: Date;
  endDate: Date;
};

type ChainRevenue = {
  labels: string;
  tx_fees: number;
  trading_fees: number;
  total: number;
};

export const getChainRevenue = async ({ startDate, endDate }: GetChainRevenueRequest) => {
  const url = new URL(`${import.meta.env.VITE_NUMIA_BASE_URL}/dydx/tokenomics/chain_revenue`);

  url.searchParams.set('start_date', startDate.toISOString().split('T')[0]);
  url.searchParams.set('end_date', endDate.toISOString().split('T')[0]);

  const response = await fetch(url);
  const data = await response.json();

  return data as ChainRevenue[];
};
