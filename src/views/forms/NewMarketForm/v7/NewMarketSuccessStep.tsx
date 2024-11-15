import { Link, useMatch } from 'react-router-dom';
import styled from 'styled-components';

import { ButtonAction, ButtonStyle, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';

import { useStringGetter } from '@/hooks/useStringGetter';

import { LinkOutIcon } from '@/icons';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';

import { getDisplayableTickerFromMarket } from '@/lib/assetUtils';

type NewMarketSuccessStepProps = {
  tickerToAdd: string;
  transactionUrl: string;
};

export const NewMarketSuccessStep = ({
  tickerToAdd,
  transactionUrl,
}: NewMarketSuccessStepProps) => {
  const stringGetter = useStringGetter();
  const match = useMatch(`${AppRoute.Trade}/:marketId`);
  const { marketId } = match?.params ?? {};
  const isOnMarketTradePage = marketId === tickerToAdd;

  const cta = isOnMarketTradePage ? null : (
    <Link to={`${AppRoute.Trade}/${tickerToAdd}`}>
      <Button type={ButtonType.Button} action={ButtonAction.Primary}>
        {stringGetter({
          key: STRING_KEYS.TRADE_MARKET,
          params: { MARKET: getDisplayableTickerFromMarket(tickerToAdd) },
        })}
      </Button>
    </Link>
  );

  return (
    <$Container>
      <$OuterCircle>
        <$InnerCircle>
          <Icon iconName={IconName.Check} />
        </$InnerCircle>
      </$OuterCircle>

      <div>
        <h2 tw="text-color-text-2 font-large-medium">
          {stringGetter({ key: STRING_KEYS.MARKET_LAUNCHED })}
        </h2>
        <span>
          {stringGetter({
            key: STRING_KEYS.MARKET_NOW_LIVE_TRADE,
            params: {
              MARKET: getDisplayableTickerFromMarket(tickerToAdd),
            },
          })}
        </span>
      </div>

      <div tw="flex flex-row gap-1">
        <Button type={ButtonType.Link} href={AppRoute.Vault} action={ButtonAction.Secondary}>
          {stringGetter({ key: STRING_KEYS.VIEW_VAULT })}
        </Button>
        {cta}
      </div>

      <div tw="flex flex-col">
        <Button
          type={ButtonType.Link}
          href={transactionUrl}
          buttonStyle={ButtonStyle.WithoutBackground}
          tw="h-fit text-color-text-0"
        >
          {stringGetter({ key: STRING_KEYS.VIEW_TRANSACTION })}
          <LinkOutIcon />
        </Button>
      </div>
    </$Container>
  );
};
const $Container = styled.div`
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;

  && {
    h2 {
      margin: 0 1rem;
    }
  }
`;

const $OuterCircle = styled.div`
  width: 5.25rem;
  height: 5.25rem;
  min-width: 5.25rem;
  height: 5.25rem;
  border-radius: 50%;
  background-color: var(--color-gradient-positive);

  display: flex;
  align-items: center;
  justify-content: center;
`;

const $InnerCircle = styled.div`
  width: 2rem;
  height: 2rem;
  min-width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: var(--color-success);

  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    color: var(--color-layer-2);
  }
`;
