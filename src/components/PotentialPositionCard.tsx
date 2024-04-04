import styled, { type AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from './AssetIcon';
import { Icon, IconName } from './Icon';
import { Link } from './Link';
import { Output, OutputType } from './Output';

type PotentialPositionCardProps = {
  onViewOrders: (marketId: string) => void;
};

export const PotentialPositionCard = ({ onViewOrders }: PotentialPositionCardProps) => {
  const stringGetter = useStringGetter();

  return (
    <Styled.PotentialPositionCard>
      <Styled.MarketRow>
        <AssetIcon symbol="ETH" /> Market Name
      </Styled.MarketRow>
      <Styled.MarginRow>
        <Styled.MarginLabel>{stringGetter({ key: STRING_KEYS.MARGIN })}</Styled.MarginLabel>{' '}
        <Styled.Output type={OutputType.Fiat} value={1_000} />
      </Styled.MarginRow>
      <Styled.ActionRow>
        <Styled.Link onClick={() => onViewOrders('UNI-USD')}>
          {stringGetter({ key: STRING_KEYS.VIEW_ORDERS })} <Icon iconName={IconName.Arrow} />
        </Styled.Link>
      </Styled.ActionRow>
    </Styled.PotentialPositionCard>
  );
};

const Styled = {
  PotentialPositionCard: styled.div`
    ${layoutMixins.flexColumn}
    width: 14rem;
    min-width: 14rem;
    height: 6.5rem;
    background-color: var(--color-layer-3);
    overflow: hidden;
    padding: 0.75rem 0;
    border-radius: 0.625rem;
  `,
  MarketRow: styled.div`
    ${layoutMixins.row}
    gap: 0.5rem;
    padding: 0 0.625rem;
    font: var(--font-small-book);

    img {
      font-size: 1.25rem; // 20px x 20px
    }
  `,
  MarginRow: styled.div`
    ${layoutMixins.spacedRow}
    padding: 0 0.625rem;
    margin-top: 0.625rem;
  `,
  MarginLabel: styled.span`
    color: var(--color-text-0);
    font: var(--font-mini-book);
  `,
  Output: styled(Output)`
    font: var(--font-small-book);
  `,
  ActionRow: styled.div`
    ${layoutMixins.spacedRow}
    border-top: var(--border);
    margin-top: 0.5rem;
    padding: 0 0.625rem;
    padding-top: 0.5rem;
  `,
  Link: styled(Link)`
    --link-color: var(--color-accent);
    font: var(--font-small-book);
  `,
} satisfies Record<string, AnyStyledComponent>;
