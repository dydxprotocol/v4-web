import styled from 'styled-components';

import type { Nullable } from '@/constants/abacus';
import { ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Details, DetailsItem } from '@/components/Details';
import { Icon, IconName } from '@/components/Icon';

import { MarketLinks } from '../MarketLinks';

type MarketDetailsProps = {
  assetName: Nullable<string>;
  assetIcon: {
    symbol?: Nullable<string>;
    logoUrl?: string;
  };
  marketDetailItems: DetailsItem[];
  primaryDescription?: string;
  secondaryDescription?: string;
  urls?: {
    technicalDoc?: Nullable<string>;
    website?: Nullable<string>;
    cmc?: Nullable<string>;
  };
};

export const MarketDetails = ({
  assetName,
  assetIcon,
  marketDetailItems,
  primaryDescription,
  secondaryDescription,
  urls,
}: MarketDetailsProps) => {
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();
  const { technicalDoc, website, cmc } = urls ?? {};

  return (
    <$MarketDetails>
      <header tw="column gap-1.25">
        <div tw="row flex-wrap gap-0.5">
          <$MarketTitle>
            <AssetIcon symbol={assetIcon.symbol} logoUrl={assetIcon.logoUrl} />
            {assetName}
          </$MarketTitle>
          {isTablet && <MarketLinks tw="[place-self:start_end]" />}
        </div>

        <$MarketDescription>
          {primaryDescription && <p>{primaryDescription}</p>}
          {secondaryDescription && <p>{secondaryDescription}</p>}
        </$MarketDescription>

        {!isTablet && (
          <div tw="row flex-wrap gap-0.5 overflow-x-auto">
            {technicalDoc && (
              <Button
                type={ButtonType.Link}
                shape={ButtonShape.Pill}
                size={ButtonSize.Small}
                href={technicalDoc}
                slotRight={<Icon iconName={IconName.LinkOut} />}
              >
                {stringGetter({ key: STRING_KEYS.WHITEPAPER })}
              </Button>
            )}
            {website && (
              <Button
                type={ButtonType.Link}
                shape={ButtonShape.Pill}
                size={ButtonSize.Small}
                href={website}
                slotRight={<Icon iconName={IconName.LinkOut} />}
              >
                {stringGetter({ key: STRING_KEYS.WEBSITE })}
              </Button>
            )}
            {cmc && (
              <Button
                type={ButtonType.Link}
                shape={ButtonShape.Pill}
                size={ButtonSize.Small}
                href={cmc}
                slotRight={<Icon iconName={IconName.LinkOut} />}
              >
                CoinmarketCap
              </Button>
            )}
          </div>
        )}
      </header>

      <Details items={marketDetailItems} withSeparators tw="font-mini-book" />
    </$MarketDetails>
  );
};

const $MarketDetails = styled.div`
  margin: auto;
  width: 100%;

  ${layoutMixins.gridConstrainedColumns}
  --grid-max-columns: 2;
  --column-gap: 2.25em;
  --column-min-width: 18rem;
  --column-max-width: 22rem;
  --single-column-max-width: 25rem;

  justify-content: center;
  align-items: center;
  padding: clamp(0.5rem, 7.5%, 2.5rem);
  row-gap: 1rem;

  @media ${breakpoints.tablet} {
    padding: 0 clamp(0.5rem, 7.5%, 2.5rem);
  }
`;
const $MarketTitle = styled.h3`
  ${layoutMixins.row}
  font: var(--font-large-medium);
  gap: 0.5rem;

  img {
    width: 2.25rem;
    height: 2.25rem;
  }
`;
const $MarketDescription = styled.div`
  ${layoutMixins.column}
  gap: 0.5em;

  p {
    font: var(--font-small-book);

    &:last-of-type {
      color: var(--color-text-0);
    }
  }
`;
