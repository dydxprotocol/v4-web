import styled from 'styled-components';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { usePerpetualMarketsStats } from '@/hooks/usePerpetualMarketsStats';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';

type ExchangeBillboardsProps = {
  className?: string;
};

export const ExchangeBillboards: React.FC<ExchangeBillboardsProps> = () => {
  const stringGetter = useStringGetter();
  const { chainTokenLabel } = useTokenConfigs();

  const {
    stats: { volume24HUSDC, openInterestUSDC, feesEarned },
  } = usePerpetualMarketsStats();
  return (
    <$MarketBillboardsWrapper>
      {[
        {
          key: 'volume',
          labelKey: STRING_KEYS.TRADING_VOLUME,
          tagKey: STRING_KEYS._24H,
          value: volume24HUSDC || undefined,
          fractionDigits: 0,
          type: OutputType.Fiat,
        },
        {
          key: 'open-interest',
          labelKey: STRING_KEYS.OPEN_INTEREST,
          tagKey: STRING_KEYS.CURRENT,
          value: openInterestUSDC || undefined,
          fractionDigits: 0,
          type: OutputType.Fiat,
        },
        {
          key: 'fee-earned-stakers',
          labelKey: STRING_KEYS.EARNED_BY_STAKERS,
          tagKey: STRING_KEYS._24H,
          value: feesEarned,
          type: OutputType.Fiat,
          linkLabelKey: STRING_KEYS.LEARN_MORE_ARROW,
          link: `${chainTokenLabel}`,
        },
      ].map(({ key, labelKey, tagKey, value, fractionDigits, type, link, linkLabelKey }) => (
        <$BillboardContainer key={key}>
          <$BillboardStat>
            <$BillboardTitle>
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label>{stringGetter({ key: labelKey })}</label>
              <Tag>{stringGetter({ key: tagKey })}</Tag>

              {link && linkLabelKey ? (
                <$BillboardLink
                  href={link}
                  size={ButtonSize.Small}
                  type={ButtonType.Link}
                  action={ButtonAction.Navigation}
                >
                  {stringGetter({ key: linkLabelKey })}
                </$BillboardLink>
              ) : null}
            </$BillboardTitle>
            <Output
              useGrouping
              withBaseFont
              fractionDigits={fractionDigits}
              type={type}
              value={value}
              tw="tablet:(font-base-book) text-text-2 font-extra-book"
            />
          </$BillboardStat>
        </$BillboardContainer>
      ))}
    </$MarketBillboardsWrapper>
  );
};

const $MarketBillboardsWrapper = styled.div`
  ${layoutMixins.column}
  gap: 0.5rem;
`;
const $BillboardContainer = styled.div`
  ${layoutMixins.row}
  flex: 1;
  justify-content: space-between;

  background-color: var(--color-layer-3);
  padding: 1rem 1.25rem;
  border-radius: 0.625rem;
`;
const $BillboardLink = styled(Button)`
  --button-textColor: var(--color-accent);
  --button-height: unset;
  --button-padding: 0;
  justify-content: flex-start;
  margin-left: auto;
`;
const $BillboardTitle = styled.div`
  ${layoutMixins.row}

  gap: 0.375rem;
`;
const $BillboardStat = styled.div`
  ${layoutMixins.column}

  flex: 1;

  label {
    color: var(--color-text-0);
    font: var(--font-small-medium);
  }

  output {
    color: var(--color-text-1);
    font: var(--font-large-medium);
  }
`;
