import { ReactNode, useMemo } from 'react';

import { RouteResponse } from '@skip-go/client';
import { DateTime } from 'luxon';
import tw from 'twin.macro';

import { CHAIN_INFO } from '@/constants/chains';
import { STRING_KEYS } from '@/constants/localization';
import { USD_DECIMALS } from '@/constants/numbers';

import { SkipRouteSpeed } from '@/hooks/transfers/skipClient';
import { useLocaleSeparators } from '@/hooks/useLocaleSeparators';
import { useStringGetter } from '@/hooks/useStringGetter';

import { LightningIcon, ShieldIcon } from '@/icons';

import { formatNumberOutput, Output, OutputType } from '@/components/Output';

import { useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { BIG_NUMBERS } from '@/lib/numbers';
import { getStringsForDateTimeDiff } from '@/lib/timeUtils';

type Props = {
  routes?: { slow?: RouteResponse; fast?: RouteResponse };
  isLoading: boolean;
  disabled: boolean;
  selectedSpeed: SkipRouteSpeed;
  onSelectSpeed: (route: SkipRouteSpeed) => void;
  type: 'deposit' | 'withdraw';
};

export const TransferRouteOptions = ({
  routes,
  isLoading,
  selectedSpeed,
  onSelectSpeed,
  disabled,
  type,
}: Props) => {
  const stringGetter = useStringGetter();
  const selectedLocale = useAppSelector(getSelectedLocale);
  const { decimal, group } = useLocaleSeparators();
  const limitAmount = formatNumberOutput(10_000, OutputType.CompactNumber, {
    selectedLocale,
    decimalSeparator: decimal,
    groupSeparator: group,
  });

  const goFastOperation = useMemo(() => {
    if (!routes?.fast) return undefined;

    return routes.fast.operations.find((op) =>
      // @ts-ignore
      Boolean(op.goFastTransfer)
    );
  }, [routes?.fast]);

  const fastRouteDescription = useMemo(() => {
    if (!routes || disabled)
      return type === 'deposit'
        ? stringGetter({
            key: STRING_KEYS.SKIP_FAST_ROUTE_DESC,
            params: { LIMIT_AMOUNT: limitAmount },
          })
        : '-';
    if (!routes.fast || !goFastOperation) return stringGetter({ key: STRING_KEYS.UNAVAILABLE });

    const fastOperationFee = routes.fast.estimatedFees.reduce(
      (acc, fee) => acc.plus(fee.usdAmount),
      BIG_NUMBERS.ZERO
    );

    return (
      <span tw="inline-block">
        {fastOperationFee.gt(0) ? (
          <Output
            tw="inline-block"
            type={OutputType.Fiat}
            fractionDigits={USD_DECIMALS}
            value={fastOperationFee}
            isLoading={isLoading}
          />
        ) : (
          <span tw="text-color-positive">{stringGetter({ key: STRING_KEYS.FREE })}</span>
        )}
      </span>
    );
  }, [goFastOperation, routes, disabled, stringGetter, isLoading, type, limitAmount]);

  const slowRouteDescription = useMemo(() => {
    const slowOperationFee = routes?.slow?.estimatedFees.reduce(
      (acc, fee) => acc.plus(fee.usdAmount),
      BIG_NUMBERS.ZERO
    );

    if (!routes || disabled)
      return type === 'deposit' ? stringGetter({ key: STRING_KEYS.SKIP_SLOW_ROUTE_DESC }) : '-';
    if (!routes.slow) return stringGetter({ key: STRING_KEYS.UNAVAILABLE });

    const chainName =
      routes.slow.sourceAssetChainID && CHAIN_INFO[routes.slow.sourceAssetChainID]?.name;

    const gasFeeAdjustment =
      type === 'deposit' && chainName ? (
        <span tw="text-color-text-0 font-mini-book">
          {` + ${stringGetter({ key: STRING_KEYS.CHAIN_GAS_FEES, params: { CHAIN: chainName } })}`}
        </span>
      ) : null;

    return (
      <span tw="inline-block">
        {slowOperationFee?.gt(0) ? (
          <Output
            tw="inline-block min-w-0"
            type={OutputType.Fiat}
            fractionDigits={USD_DECIMALS}
            value={slowOperationFee}
            isLoading={isLoading}
            slotRight={gasFeeAdjustment}
          />
        ) : (
          <span tw="text-color-positive">{stringGetter({ key: STRING_KEYS.FREE })}</span>
        )}
      </span>
    );
  }, [routes, disabled, stringGetter, isLoading, type]);

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
      {type === 'deposit' && (
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
      )}
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
      tw="box-border flex min-w-0 flex-1 items-center gap-0.75 rounded-1 border-2 border-solid p-1"
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
