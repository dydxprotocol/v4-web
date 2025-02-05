import { ReactNode, useMemo } from 'react';

import { RouteResponse } from '@skip-go/client';
import { DateTime } from 'luxon';
import tw from 'twin.macro';
import { formatUnits } from 'viem';

import { STRING_KEYS } from '@/constants/localization';
import { USD_DECIMALS } from '@/constants/numbers';

import { SkipRouteSpeed } from '@/hooks/transfers/skipClient';
import { useStringGetter } from '@/hooks/useStringGetter';

import { LightningIcon, ShieldIcon } from '@/icons';

import { Output, OutputType } from '@/components/Output';

import { getStringsForDateTimeDiff } from '@/lib/timeUtils';

type Props = {
  routes?: { slow?: RouteResponse; fast?: RouteResponse };
  isLoading: boolean;
  disabled: boolean;
  selectedSpeed: SkipRouteSpeed;
  onSelectSpeed: (route: SkipRouteSpeed) => void;
};

export const DepositRouteOptions = ({
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
            css={[
              selectedSpeed === 'fast' && !isLoading
                ? tw`text-color-favorite`
                : `text-color-text-0`,
            ]}
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

export const WithdrawRouteOptions = ({
  routes,
  isLoading,
  selectedSpeed,
  onSelectSpeed,
  disabled,
}: Props) => {
  const stringGetter = useStringGetter();

  const goFastOperation = useMemo(() => {
    if (!routes?.fast) return undefined;

    return routes.fast.operations.find((op) =>
      // @ts-ignore
      Boolean(op.goFastTransfer)
    );
  }, [routes?.fast]);

  const fastRouteDescription = useMemo(() => {
    if (!routes || disabled) return '-';
    if (!routes.fast) return stringGetter({ key: STRING_KEYS.UNAVAILABLE });

    if (!goFastOperation) return stringGetter({ key: STRING_KEYS.UNAVAILABLE });

    // @ts-ignore
    const fastOperationFee = goFastOperation.goFastTransfer?.fee;

    const totalFastFee = fastOperationFee
      ? formatUnits(
          BigInt(fastOperationFee.bpsFeeAmount ?? 0) +
            BigInt(fastOperationFee.destinationChainFeeAmount ?? 0) +
            BigInt(fastOperationFee.sourceChainFeeAmount ?? 0),
          6
        )
      : undefined;

    return (
      <span tw="inline-block">
        {fastOperationFee ? (
          <Output
            tw="inline-block"
            type={OutputType.Fiat}
            fractionDigits={USD_DECIMALS}
            value={totalFastFee}
            isLoading={isLoading}
          />
        ) : (
          <span tw="text-color-positive">{stringGetter({ key: STRING_KEYS.FREE })}</span>
        )}
      </span>
    );
  }, [goFastOperation, routes, disabled, stringGetter, isLoading]);

  const slowRouteDescription = useMemo(() => {
    const slowOperationFee = routes?.fast?.estimatedFees[0]?.usdAmount;

    if (!routes || disabled) return '-';
    if (!routes.slow) return stringGetter({ key: STRING_KEYS.UNAVAILABLE });

    return (
      <span tw="inline-block">
        {slowOperationFee ? (
          <Output
            tw="inline-block"
            type={OutputType.Fiat}
            fractionDigits={USD_DECIMALS}
            value={slowOperationFee}
            isLoading={isLoading}
          />
        ) : (
          <span tw="text-color-positive">{stringGetter({ key: STRING_KEYS.FREE })}</span>
        )}
      </span>
    );
  }, [routes, disabled, stringGetter, isLoading]);

  const slowRouteSpeed = routes?.slow?.estimatedRouteDurationSeconds;
  const slowRouteDuration = Date.now() + (slowRouteSpeed ?? 0) * 1000;
  const { timeString, unitStringKey } = getStringsForDateTimeDiff(
    DateTime.fromMillis(slowRouteDuration)
  );
  const slowRouteTitle = slowRouteSpeed
    ? `${timeString}${stringGetter({ key: unitStringKey })}`
    : stringGetter({ key: STRING_KEYS.DEFAULT });

  return (
    <div tw="flex gap-0.5">
      <RouteOption
        icon={
          <span
            css={[
              selectedSpeed === 'fast' && !isLoading
                ? tw`text-color-favorite`
                : `text-color-text-0`,
            ]}
          >
            <LightningIcon />
          </span>
        }
        selected={selectedSpeed === 'fast'}
        disabled={disabled || !goFastOperation || isLoading}
        onClick={() => onSelectSpeed('fast')}
        title={stringGetter({ key: STRING_KEYS.INSTANT })}
        description={fastRouteDescription}
      />
      <RouteOption
        icon={
          <span
            css={[
              selectedSpeed === 'slow' && !isLoading ? tw`text-color-accent` : `text-color-text-0`,
            ]}
          >
            <ShieldIcon />
          </span>
        }
        selected={selectedSpeed === 'slow'}
        disabled={disabled || !routes?.slow || isLoading}
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
      <div tw="flex flex-col items-start gap-0.125 text-left">
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
