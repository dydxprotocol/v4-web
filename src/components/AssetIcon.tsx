import { useState } from 'react';

import styled from 'styled-components';

import { Nullable } from '@/constants/abacus';
import { ASSET_ICON_MAP } from '@/constants/assets';
import { CHAIN_INFO } from '@/constants/chains';

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
  chainId,
}: {
  logoUrl?: Nullable<string>;
  symbol?: Nullable<string>;
  className?: string;
  chainId?: string;
}) => {
  const [isError, setIsError] = useState(false);

  if (isError || (!logoUrl && !isAssetSymbol(symbol))) {
    return <Placeholder className={className} symbol={symbol ?? ''} />;
  }

  return logoUrl ? (
    <$Container className={className}>
      <$AssetIcon
        src={logoUrl}
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
    </$Container>
  ) : isAssetSymbol(symbol) ? (
    <$Container className={className}>
      <$AssetIcon src={ASSET_ICON_MAP[symbol]} alt={symbol} />
      {chainId && (
        <img
          tw="absolute bottom-[-2px] right-[-2px] h-[50%] w-[50%] rounded-9 border border-solid border-color-layer-4"
          src={CHAIN_INFO[chainId]?.icon}
          alt={CHAIN_INFO[chainId]?.name}
        />
      )}
    </$Container>
  ) : (
    <Placeholder className={className} symbol={symbol ?? ''} />
  );
};

const $Container = styled.div`
  height: var(--asset-icon-size, 1em);
  min-height: var(--asset-icon-size, 1em);
  width: var(--asset-icon-size, 1em);
  min-width: var(--asset-icon-size, 1em);
  background-color: var(--asset-icon-backgroundColor, var(--color-white));
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const $AssetIcon = styled.img`
  height: 100%;
  min-height: 100%;
  width: 100%;
  min-width: 100%;
  object-fit: cover;
  transform: scale(1.05); // Scale in order to hide outline from '--asset-icon-backgroundColor'

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
