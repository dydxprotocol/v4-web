import { useMemo } from 'react';

import { Outlet, useMatch, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { ButtonStyle } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute, HistoryRoute, PortfolioRoute } from '@/constants/routes';

import { useStringGetter } from '@/hooks/useStringGetter';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { TabNavigator } from '@/components/TabNavigator';

export const SimpleUiHistory = () => {
  const stringGetter = useStringGetter();
  const navigate = useNavigate();

  const matchTrades = useMatch(
    `${AppRoute.Portfolio}/${PortfolioRoute.History}/${HistoryRoute.Trades}`
  );
  const matchTransfers = useMatch(
    `${AppRoute.Portfolio}/${PortfolioRoute.History}/${HistoryRoute.Transfers}`
  );
  const matchVaultTransfers = useMatch(
    `${AppRoute.Portfolio}/${PortfolioRoute.History}/${HistoryRoute.VaultTransfers}`
  );

  const currentRoute = useMemo(() => {
    if (matchTrades != null) return HistoryRoute.Trades;
    if (matchTransfers != null) return HistoryRoute.Transfers;
    if (matchVaultTransfers != null) return HistoryRoute.VaultTransfers;

    return HistoryRoute.Trades;
  }, [matchTrades, matchTransfers, matchVaultTransfers]);

  const handleBack = () => {
    navigate(AppRoute.Markets);
  };

  const tabNavivator = (
    <TabNavigator
      value={currentRoute}
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
      <div tw="row relative mb-[1rem] mt-[1.375rem] justify-center">
        <h1 tw="text-color-text-2 font-large-bold">{stringGetter({ key: STRING_KEYS.HISTORY })}</h1>
        <$BackButton
          onClick={handleBack}
          iconName={IconName.Caret}
          buttonStyle={ButtonStyle.WithoutBackground}
        />
      </div>
      {tabNavivator}
    </div>
  );
};

const $BackButton = styled(IconButton)`
  position: absolute;
  left: 1.25rem;
  top: 0;
  bottom: 0;
  transform: rotate(0.25turn);

  svg {
    height: 1rem;
    width: 1rem;
  }
`;

const $TableContainer = styled.div`
  display: grid;
`;
