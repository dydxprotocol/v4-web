import { type FC, useMemo } from 'react';
import { Tooltip } from '@radix-ui/themes';
import { $decimalValue, Usdc } from 'fuel-ts-sdk';
import { WalletContext } from '@/contexts/WalletContext';
import { formatCurrency } from '@/lib/formatCurrency';
import { useSdkQuery, useTradingSdk } from '@/lib/fuel-ts-sdk';
import { usePromise } from '@/lib/usePromise';
import { useRequiredContext } from '@/lib/useRequiredContext';
import * as $ from './WalletCollateralCard.css';

export const WalletCollateralCard: FC = () => {
  const wallet = useRequiredContext(WalletContext);
  const trading = useTradingSdk();

  const baseAsset = useSdkQuery(() => trading.getBaseAsset());

  const collateralPromise = usePromise<bigint | undefined>(
    useMemo(
      () =>
        baseAsset
          ? wallet.getUserBalances().then((a) => a[baseAsset.assetId])
          : Promise.resolve(0n),
      [baseAsset, wallet]
    ),
    true
  );

  const isLoading = collateralPromise.status === 'pending';
  const amount =
    collateralPromise.status === 'fulfilled' && !!collateralPromise.data
      ? $decimalValue(Usdc.fromBigInt(collateralPromise.data)).toFloat()
      : 0;

  const shouldCompact = amount >= COMPACT_THRESHOLD;
  const displayValue = formatCurrency(amount, { compact: shouldCompact });
  const fullValue = formatCurrency(amount);

  const content = (
    <div css={$.collateralContainer}>
      <div css={$.collateralContent}>
        <span css={$.collateralLabel}>Collateral</span>
        <div css={$.collateralValue}>
          {isLoading ? (
            <>
              <div css={$.skeleton} />
              <div css={$.skeletonSymbol} />
            </>
          ) : (
            <>
              <span css={$.collateralAmount}>{displayValue}</span>
              <span css={$.collateralSymbol}>{baseAsset?.symbol}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (isLoading || !shouldCompact) {
    return content;
  }

  return <Tooltip content={`${fullValue} ${baseAsset?.symbol ?? ''}`}>{content}</Tooltip>;
};

const COMPACT_THRESHOLD = 100_000;
