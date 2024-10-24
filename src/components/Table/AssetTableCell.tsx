import styled from 'styled-components';

import type { Nullable } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { MarketData } from '@/constants/markets';

import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';

import { AssetIcon } from '@/components/AssetIcon';
import { Tag } from '@/components/Tag';

import { getDisplayableAssetFromBaseAsset } from '@/lib/assetUtils';
import { calculateMarketMaxLeverage } from '@/lib/marketsHelpers';
import { orEmptyObj } from '@/lib/typeUtils';

import { Output, OutputType } from '../Output';
import { TableCell } from './TableCell';

interface AssetTableCellProps {
  symbol?: string;
  name?: Nullable<string>;
  configs:
    | Pick<
        MarketData,
        | 'effectiveInitialMarginFraction'
        | 'imageUrl'
        | 'initialMarginFraction'
        | 'isUnlaunched'
        | 'volume24H'
      >
    | null
    | undefined;
  className?: string;
  stacked?: boolean;
  showStackedVolume?: boolean;
}

export const AssetTableCell = (props: AssetTableCellProps) => {
  const stringGetter = useStringGetter();
  const { symbol, name, stacked, configs, showStackedVolume, className } = props;
  const useStackedStyle = stacked ?? showStackedVolume;
  const {
    imageUrl,
    initialMarginFraction,
    effectiveInitialMarginFraction,
    isUnlaunched,
    volume24H,
  } = orEmptyObj(configs);

  const maxLeverage =
    configs != null ? (
      <Output
        type={OutputType.Multiple}
        value={calculateMarketMaxLeverage({
          effectiveInitialMarginFraction,
          initialMarginFraction,
        })}
        fractionDigits={0}
      />
    ) : undefined;

  return (
    <TableCell
      className={className}
      slotLeft={<$AssetIcon logoUrl={imageUrl} stacked={useStackedStyle} symbol={symbol} />}
    >
      <$TableCellContent stacked={useStackedStyle}>
        <div tw="row gap-0.5">
          <$Asset stacked={stacked}>{name}</$Asset>
          <Tag>{isUnlaunched ? stringGetter({ key: STRING_KEYS.LAUNCHABLE }) : maxLeverage}</Tag>
        </div>
        {useStackedStyle ? (
          showStackedVolume ? (
            <Output
              type={OutputType.CompactFiat}
              value={volume24H ?? undefined}
              tw="text-color-text-0 font-mini-medium"
            />
          ) : (
            <span tw="text-color-text-0 font-mini-medium">
              {symbol && getDisplayableAssetFromBaseAsset(symbol)}
            </span>
          )
        ) : undefined}
      </$TableCellContent>
    </TableCell>
  );
};

const $TableCellContent = styled.div<{ stacked?: boolean }>`
  gap: ${({ stacked }) => (stacked ? '0.125rem' : '0.75rem')};
  display: flex;
  flex-direction: ${({ stacked }) => (stacked ? 'column' : 'row')};
  align-items: ${({ stacked }) => (stacked ? 'flex-start' : 'center')};
`;
const $AssetIcon = styled(AssetIcon)<{ stacked?: boolean }>`
  font-size: ${({ stacked }) => (stacked ? '1.5rem' : '2rem')};

  @media ${breakpoints.tablet} {
    font-size: ${({ stacked }) => (stacked ? '1.5rem' : '2.25rem')};
  }
`;
const $Asset = styled.span<{ stacked?: boolean }>`
  color: var(--color-text-1);
  font: ${({ stacked }) => (stacked ? 'var(--font-small-medium)' : 'var(--font-medium-medium)')};
`;
