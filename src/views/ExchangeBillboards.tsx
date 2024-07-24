import styled from 'styled-components';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { usePerpetualMarketsStats } from '@/hooks/usePerpetualMarketsStats';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

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
    <div tw="column gap-0.5">
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
        <div key={key} tw="row flex-1 justify-between rounded-0.625 bg-layer-3 px-1.25 py-1">
          <$BillboardStat>
            <div tw="row gap-0.375">
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
            </div>
            <Output
              useGrouping
              withBaseFont
              fractionDigits={fractionDigits}
              type={type}
              value={value}
              tw="text-text-2 font-extra-book tablet:font-base-book"
            />
          </$BillboardStat>
        </div>
      ))}
    </div>
  );
};
const $BillboardLink = styled(Button)`
  --button-textColor: var(--color-accent);
  --button-height: unset;
  --button-padding: 0;
  justify-content: flex-start;
  margin-left: auto;
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
