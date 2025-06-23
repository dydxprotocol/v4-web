import { useMemo } from 'react';

import { Outlet, useMatch } from 'react-router-dom';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { AppRoute, HistoryRoute, PortfolioRoute } from '@/constants/routes';

import { useStringGetter } from '@/hooks/useStringGetter';

import { SimpleUiHeader } from '@/components/SimpleUiHeader';
import { TabNavigator } from '@/components/TabNavigator';

export const SimpleUiHistory = () => {
  const stringGetter = useStringGetter();

  const matchTrades = useMatch(
    `${AppRoute.Portfolio}/${PortfolioRoute.History}/${HistoryRoute.Trades}`
  );
  const matchTransfers = useMatch(
    `${AppRoute.Portfolio}/${PortfolioRoute.History}/${HistoryRoute.Transfers}`
  );
  const matchVaultTransfers = useMatch(
    `${AppRoute.Portfolio}/${PortfolioRoute.History}/${HistoryRoute.VaultTransfers}`
  );
  const matchPayments = useMatch(
    `${AppRoute.Portfolio}/${PortfolioRoute.History}/${HistoryRoute.Payments}`
  );

  const currentRoute = useMemo(() => {
    if (matchTrades != null) return HistoryRoute.Trades;
    if (matchTransfers != null) return HistoryRoute.Transfers;
    if (matchVaultTransfers != null) return HistoryRoute.VaultTransfers;
    if (matchPayments != null) return HistoryRoute.Payments;
    return HistoryRoute.Trades;
  }, [matchTrades, matchTransfers, matchVaultTransfers, matchPayments]);

  const tabNavivator = (
    <TabNavigator
      value={currentRoute}
      css={{
        '--trigger-paddingX': 0,
      }}
      items={[
        {
          value: HistoryRoute.Trades,
          label: stringGetter({ key: STRING_KEYS.TRADES }),
        },
        {
          value: HistoryRoute.Transfers,
          label: stringGetter({ key: STRING_KEYS.ACCOUNT }),
        },
        {
          value: HistoryRoute.Payments,
          label: stringGetter({ key: STRING_KEYS.FUNDING_PAYMENTS_SHORT }),
        },
        {
          value: HistoryRoute.VaultTransfers,
          label: stringGetter({ key: STRING_KEYS.VAULT }),
        },
      ]}
      sharedContent={
        <$TableContainer>
          <Outlet />
        </$TableContainer>
      }
    />
  );

  return (
    <div tw="flexColumn h-full w-full">
      <SimpleUiHeader
        pageTitle={stringGetter({ key: STRING_KEYS.HISTORY })}
        to={AppRoute.Markets}
      />
      {tabNavivator}
    </div>
  );
};

const $TableContainer = styled.div`
  display: grid;
  min-height: 12.5rem;
`;
