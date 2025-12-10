import { useContext, useMemo, useState } from 'react';

import styled, { css } from 'styled-components';

import { ASSET_ICON_MAP } from '@/constants/assets';
import { CHAIN_INFO } from '@/constants/chains';

import { LoadingContext } from '@/contexts/LoadingContext';

import { Nullable } from '@/lib/typeUtils';

import { LoadingAssetIcon } from './Loading/LoadingAssetIcon';

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
  isLoading = false,
}: {
  logoUrl?: Nullable<string>;
  symbol?: Nullable<string>;
  className?: string;
  chainId?: string;
  isLoading?: boolean;
}) => {
  const [isError, setIsError] = useState(false);
  const isAssetIconLoading = useContext(LoadingContext);

  const placeHolderElement = useMemo(
    () => (
      <$Container className={className} $hasChainIcon={!!chainId}>
        <Placeholder className={className} symbol={symbol ?? ''} />
        {chainId && <$ChainIcon src={CHAIN_INFO[chainId]?.icon} alt={CHAIN_INFO[chainId]?.name} />}
      </$Container>
    ),
    [chainId, className, symbol]
  );

  if (isLoading || isAssetIconLoading) {
    return <$LoadingAssetIcon className={className} />;
  }

  if (isError || (!logoUrl && !isAssetSymbol(symbol))) {
    return placeHolderElement;
  }

  return logoUrl ? (
    <$Container className={className} $hasChainIcon={!!chainId}>
      <$ContainerBackground />
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
      {chainId && <$ChainIcon src={CHAIN_INFO[chainId]?.icon} alt={CHAIN_INFO[chainId]?.name} />}
    </$Container>
  ) : isAssetSymbol(symbol) ? (
    <$Container className={className} $hasChainIcon={!!chainId}>
      <$ContainerBackground />
      <$AssetIcon src={ASSET_ICON_MAP[symbol]} alt={symbol} />
      {chainId && <$ChainIcon src={CHAIN_INFO[chainId]?.icon} alt={CHAIN_INFO[chainId]?.name} />}
    </$Container>
  ) : (
    placeHolderElement
  );
};

const $Container = styled.div<{ $hasChainIcon?: boolean }>`
  height: var(--asset-icon-size, 1em);
  min-height: var(--asset-icon-size, 1em);
  width: var(--asset-icon-size, 1em);
  min-width: var(--asset-icon-size, 1em);
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  ${({ $hasChainIcon }) =>
    !$hasChainIcon &&
    css`
      overflow: hidden;
    `}
`;

const $AssetIcon = styled.img`
  height: 100%;
  min-height: 100%;
  width: 100%;
  min-width: 100%;
  object-fit: cover;
  transform: scale(1);
  border-radius: 50%;
`;

const $ContainerBackground = styled.div`
  position: absolute;
  height: 100%;
  min-height: 100%;
  width: 100%;
  min-width: 100%;
  transform: scale(0.97); // Scale in order to hide outline from '--asset-icon-backgroundColor'
  background-color: var(--asset-icon-backgroundColor, var(--color-white));
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

const $ChainIcon = styled.img`
  position: absolute;
  bottom: -2px;
  right: -2px;
  height: 50%;
  width: 50%;
  border-radius: 9px;
  border: 2px solid var(--asset-icon-chain-icon-borderColor, var(--color-layer-4));
`;

const $LoadingAssetIcon = styled(LoadingAssetIcon)`
  --loading-asset-icon-size: var(--asset-icon-size, 1em);
`;
