import { ReactNode } from 'react';

import { RouteResponse } from '@skip-go/client';
import { formatUnits } from 'viem';

import { USD_DECIMALS } from '@/constants/numbers';

import { SkipRouteSpeed } from '@/hooks/transfers/skipClient';

import { LightningIcon, ShieldIcon } from '@/icons';

import { Output, OutputType } from '@/components/Output';

type Props = {
  routes: { slow?: RouteResponse; fast?: RouteResponse };
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
  // TODO(deposit2.0): finalize error handling here
  if (!routes.slow && !routes.fast) {
    return <div>There was an error loading deposit quotes.</div>;
  }

  const fastOperationFee = // @ts-ignore
    routes.fast?.operations.find((op) => Boolean(op.goFastTransfer))?.goFastTransfer?.fee;
  const totalFastFee = fastOperationFee
    ? formatUnits(
        BigInt(fastOperationFee.bpsFeeAmount ?? 0) +
          BigInt(fastOperationFee.destinationChainFeeAmount ?? 0) +
          BigInt(fastOperationFee.sourceChainFeeAmount ?? 0),
        6
      )
    : '-';

  return (
    <div tw="flex gap-1">
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
        disabled={disabled || !routes.fast || isLoading}
        onClick={() => onSelectSpeed('fast')}
        // TODO(deposit2.0): localization
        title="Instant"
        description={
          routes.fast ? (
            <span>
              <Output
                tw="inline"
                type={OutputType.Fiat}
                fractionDigits={USD_DECIMALS}
                value={totalFastFee}
              />{' '}
              fee, $10k limit
            </span>
          ) : (
            'Unavailable'
          )
        }
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
        disabled={disabled || !routes.slow}
        onClick={() => onSelectSpeed('slow')}
        // TODO(deposit2.0): localization
        title="~20 mins"
        description={
          routes.slow ? (
            <span>
              <Output
                tw="inline"
                type={OutputType.Fiat}
                fractionDigits={USD_DECIMALS}
                value={routes.slow.estimatedFees[0]?.usdAmount}
              />{' '}
              fee, no limit
            </span>
          ) : (
            'Unavailable'
          )
        }
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
