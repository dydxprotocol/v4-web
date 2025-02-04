import { ReactNode, useMemo } from 'react';

import { RouteResponse } from '@skip-go/client';
import { formatUnits } from 'viem';

import { USD_DECIMALS } from '@/constants/numbers';

import { SkipRouteSpeed } from '@/hooks/transfers/skipClient';

import { LightningIcon, ShieldIcon } from '@/icons';

import { Output, OutputType } from '@/components/Output';

type Props = {
  routes?: { slow?: RouteResponse; fast?: RouteResponse };
  isLoading: boolean;
  disabled: boolean;
  selectedSpeed: SkipRouteSpeed;
  onSelectSpeed: (route: SkipRouteSpeed) => void;
};

export const RouteOptions = ({
  routes,
  isLoading,
  selectedSpeed,
  onSelectSpeed,
  disabled,
}: Props) => {
  const fastRouteDescription = useMemo(() => {
    const fastOperationFee = // @ts-ignore
      routes?.fast?.operations.find((op) => Boolean(op.goFastTransfer))?.goFastTransfer?.fee;
    const totalFastFee = fastOperationFee
      ? formatUnits(
          BigInt(fastOperationFee.bpsFeeAmount ?? 0) +
            BigInt(fastOperationFee.destinationChainFeeAmount ?? 0) +
            BigInt(fastOperationFee.sourceChainFeeAmount ?? 0),
          6
        )
      : '-';

    // TODO(deposit2.0): localization
    if (!routes || disabled) return '$$ fee, $10k limit';
    if (!routes.fast) return 'Unavailable';

    return (
      <span>
        <Output
          tw="inline"
          type={OutputType.Fiat}
          fractionDigits={USD_DECIMALS}
          value={totalFastFee}
        />{' '}
        fee, $10k limit
      </span>
    );
  }, [routes, disabled]);

  const slowRouteDescription = useMemo(() => {
    // TODO(deposit2.0): localization
    if (!routes || disabled) return '$ fee, no limit';
    if (!routes.slow) return 'Unavailable';

    return (
      <span>
        <Output
          tw="inline"
          type={OutputType.Fiat}
          fractionDigits={USD_DECIMALS}
          value={routes.slow.estimatedFees[0]?.usdAmount ?? '0'}
        />{' '}
        fee, no limit
      </span>
    );
  }, [routes, disabled]);

  const slowRouteSpeed = routes?.slow?.estimatedRouteDurationSeconds;
  // TODO(deposit2.0): localization
  // "slow" route could be fast when going from solana or cosmos
  const slowRouteTitle =
    slowRouteSpeed && slowRouteSpeed <= 60 ? `~${slowRouteSpeed} seconds` : '~20 mins';

  return (
    <div tw="flex gap-0.5">
      <RouteOption
        icon={
          <span
            style={{
              color:
                selectedSpeed === 'fast' && !isLoading
                  ? 'var(--color-favorite)'
                  : 'var(--color-text-0)',
            }}
          >
            <LightningIcon />
          </span>
        }
        selected={selectedSpeed === 'fast'}
        disabled={disabled || !routes?.fast || isLoading}
        onClick={() => onSelectSpeed('fast')}
        // TODO(deposit2.0): localization
        title="Instant"
        description={fastRouteDescription}
      />
      <RouteOption
        icon={
          <span
            style={{
              color:
                selectedSpeed === 'slow' && !isLoading
                  ? 'var(--color-accent)'
                  : 'var(--color-text-0)',
            }}
          >
            <ShieldIcon />
          </span>
        }
        selected={selectedSpeed === 'slow'}
        disabled={disabled || isLoading || !routes?.slow}
        onClick={() => onSelectSpeed('slow')}
        title={slowRouteTitle}
        description={slowRouteDescription}
      />
    </div>
  );
};

type RouteOptionProps = {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  selected: boolean;
};

const RouteOption = ({
  icon,
  title,
  description,
  disabled,
  onClick,
  selected,
}: RouteOptionProps) => {
  return (
    <button
      type="button"
      tw="box-border flex flex-1 items-center gap-0.75 rounded-1 border-2 border-solid p-1"
      disabled={disabled}
      onClick={onClick}
      style={{
        opacity: disabled ? '0.5' : '1',
        borderColor: selected ? 'var(--color-accent)' : 'var(--color-layer-4)',
        backgroundColor: selected && !disabled ? 'var(--color-layer-2)' : 'var(--color-layer-4)',
      }}
    >
      {icon}
      <div tw="flex flex-col items-start gap-0.125">
        <div
          tw="text-medium"
          style={{
            color: selected && !disabled ? 'var(--color-text-2)' : undefined,
          }}
        >
          {title}
        </div>
        <div tw="text-small text-color-text-1">{description}</div>
      </div>
    </button>
  );
};
