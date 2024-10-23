import { useState } from 'react';

import styled from 'styled-components';

import { Nullable } from '@/constants/abacus';
import { ASSET_ICON_MAP } from '@/constants/assets';

export type AssetSymbol = keyof typeof ASSET_ICON_MAP;

const Placeholder = ({ className, symbol }: { className?: string; symbol: string }) => (
  <$Placeholder className={className}>
    <span>{symbol[0]}</span>
  </$Placeholder>
);

const isAssetSymbol = (symbol: Nullable<string>): symbol is AssetSymbol =>
  symbol != null && Object.hasOwn(ASSET_ICON_MAP, symbol);

export const AssetIcon = ({
  logoUrl,
  symbol,
  className,
}: {
  logoUrl?: Nullable<string>;
  symbol?: Nullable<string>;
  className?: string;
}) => {
  const [isError, setIsError] = useState(false);

  if (isError || (!logoUrl && !isAssetSymbol(symbol))) {
    return <Placeholder className={className} symbol={symbol ?? ''} />;
  }

  return logoUrl ? (
    <$AssetIcon
      src={logoUrl}
      className={className}
      alt={symbol ?? 'logo'}
      tw="h-[1em] w-auto rounded-[50%]"
      onError={({ currentTarget }) => {
        currentTarget.onerror = null;
        if (isAssetSymbol(symbol)) {
          currentTarget.src = ASSET_ICON_MAP[symbol];
        } else {
          setIsError(true);
        }
      }}
    />
  ) : isAssetSymbol(symbol) ? (
    <$AssetIcon src={ASSET_ICON_MAP[symbol]} className={className} alt={symbol} />
  ) : (
    <Placeholder className={className} symbol={symbol ?? ''} />
  );
};

const $AssetIcon = styled.img`
  --asset-icon-size: 1em;
  background-color: var(--color-white);

  height: var(--asset-icon-size);
  min-height: var(--asset-icon-size);
  width: var(--asset-icon-size);
  min-width: var(--asset-icon-size);

  border-radius: 50%;
`;

const $Placeholder = styled.div`
  --asset-icon-size: 1em;

  height: var(--asset-icon-size);
  min-height: var(--asset-icon-size);
  width: var(--asset-icon-size);
  min-width: var(--asset-icon-size);

  background-color: var(--color-layer-5);
  border-radius: 50%;
  overflow: hidden;

  span {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-size: 0.5em;
  }
`;
