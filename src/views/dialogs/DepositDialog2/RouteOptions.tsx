import { RouteResponse } from '@skip-go/client';
import { formatUnits } from 'viem';

import { LightningIcon, ShieldIcon } from '@/icons';

import { DepositSpeed } from './types';

type Props = {
  routes: { slow?: RouteResponse; fast?: RouteResponse };
  isLoading: boolean;
  disabled: boolean;
  selectedSpeed: DepositSpeed;
  onSelectSpeed: (route: DepositSpeed) => void;
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
    return <div>There was a error loading deposit quotes.</div>;
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
      <button
        type="button"
        tw="box-border flex flex-1 items-center gap-0.75 rounded-1 border-2 border-solid p-1"
        disabled={disabled || !routes.fast}
        onClick={() => onSelectSpeed('fast')}
        style={{
          opacity: isLoading || disabled ? '0.5' : '1',
          borderColor: selectedSpeed === 'fast' ? 'var(--color-accent)' : 'var(--color-layer-4)',
          backgroundColor:
            selectedSpeed === 'fast' && !isLoading
              ? 'var(--color-layer-2)'
              : 'var(--color-layer-4)',
        }}
      >
        <span
          style={{
            color:
              selectedSpeed === 'fast' && !isLoading
                ? 'var(--color-yellow-0)'
                : 'var(--color-layer-2)',
          }}
        >
          <LightningIcon />
        </span>
        <div tw="flex flex-col items-start gap-0.125">
          <div
            tw="text-medium"
            style={{
              color: selectedSpeed === 'fast' && !isLoading ? 'var(--color-text-2)' : undefined,
            }}
          >
            {/* TODO(deposit2.0): Localization */}
            Instant
          </div>
          <div tw="text-small text-color-text-1">
            {routes.fast ? `$${totalFastFee} fee, $10k limit` : 'Unavailable'}
          </div>
        </div>
      </button>
      <button
        type="button"
        tw="box-border flex flex-1 items-center gap-0.75 rounded-1 border-2 border-solid p-1"
        disabled={disabled}
        onClick={() => onSelectSpeed('slow')}
        style={{
          opacity: isLoading || disabled ? '0.5' : '1',
          borderColor: selectedSpeed === 'slow' ? 'var(--color-accent)' : 'var(--color-layer-4)',
          backgroundColor:
            selectedSpeed === 'slow' && !isLoading
              ? 'var(--color-layer-2)'
              : 'var(--color-layer-4)',
        }}
      >
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
        <div tw="flex flex-col items-start gap-0.125">
          {/* TODO(deposit2.0): Localization */}
          <div
            tw="text-medium"
            style={{
              color: selectedSpeed === 'slow' && !isLoading ? 'var(--color-text-2)' : undefined,
            }}
          >
            ~20 mins
          </div>
          <div tw="text-small">
            {routes.slow
              ? `$${routes.slow.estimatedFees[0]?.usdAmount} fee, no limit`
              : 'Unavailable'}
          </div>
        </div>
      </button>
    </div>
  );
};
