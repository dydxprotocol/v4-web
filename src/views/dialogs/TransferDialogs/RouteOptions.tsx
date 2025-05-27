import { ReactNode, useMemo } from 'react';

import { RouteResponse } from '@skip-go/client';
import { DateTime } from 'luxon';
import tw from 'twin.macro';

import { CHAIN_INFO } from '@/constants/chains';
import { STRING_KEYS } from '@/constants/localization';
import { USD_DECIMALS } from '@/constants/numbers';
import {
  SKIP_GO_BPS_FEE,
  SKIP_GO_DESTINATION_FEE,
  SKIP_GO_FAST_SOURCE_FEE_MAP,
  SKIP_GO_FAST_TRANSFER_LIMIT,
} from '@/constants/skip';

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
  chainId?: string;
  routes?: { slow?: RouteResponse; fast?: RouteResponse };
  isLoading: boolean;
  disabled: boolean;
  selectedSpeed: SkipRouteSpeed;
  onSelectSpeed: (route: SkipRouteSpeed) => void;
  type: 'deposit' | 'withdraw';
};

export const TransferRouteOptions = ({
  chainId,
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
  const limitAmount = formatNumberOutput(SKIP_GO_FAST_TRANSFER_LIMIT, OutputType.CompactNumber, {
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
    if (!routes || disabled) {
      const sourceFee = SKIP_GO_FAST_SOURCE_FEE_MAP[chainId ?? ''];
      const bpsFee = formatNumberOutput(SKIP_GO_BPS_FEE / 100, OutputType.Percent, {
        selectedLocale,
        decimalSeparator: decimal,
        groupSeparator: group,
        fractionDigits: 1,
      });

      const estimatedFee = sourceFee ? `${sourceFee + SKIP_GO_DESTINATION_FEE} + ${bpsFee}` : '$';

      return type === 'deposit'
        ? stringGetter({
            key: STRING_KEYS.SKIP_FAST_ROUTE_DESC_1,
            params: { FEE: estimatedFee, LIMIT_AMOUNT: limitAmount },
          })
        : '-';
    }
    if (!routes.fast || !goFastOperation) return stringGetter({ key: STRING_KEYS.UNAVAILABLE });

    const fastOperationFee = routes.fast.estimatedFees?.reduce(
      (acc, fee) => (fee.usdAmount != null ? acc.plus(fee.usdAmount) : acc),
      BIG_NUMBERS.ZERO
    );

    return (
      <span tw="inline-block">
        {fastOperationFee?.gt(0) ? (
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
  }, [chainId, goFastOperation, routes, disabled, stringGetter, isLoading, type, limitAmount]);

  const slowRouteDescription = useMemo(() => {
    const slowOperationFee = routes?.slow?.estimatedFees?.reduce(
      (acc, fee) => (fee.usdAmount != null ? acc.plus(fee.usdAmount) : acc),
      BIG_NUMBERS.ZERO
    );

    if (!routes || disabled)
      return type === 'deposit' ? stringGetter({ key: STRING_KEYS.SKIP_SLOW_ROUTE_DESC_1 }) : '-';
    if (!routes.slow) return stringGetter({ key: STRING_KEYS.UNAVAILABLE });

    const gasDenom =
      routes.slow.sourceAssetChainId && CHAIN_INFO[routes.slow.sourceAssetChainId]?.gasDenom;

    const gasFeeAdjustment =
      type === 'deposit' && gasDenom ? (
        <span tw="text-color-text-0 font-mini-book">
          {` + ${stringGetter({ key: STRING_KEYS.CHAIN_GAS_FEES_SHORT, params: { CHAIN: gasDenom } })}`}
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
      tw="box-border flex min-w-0 flex-1 items-center gap-0.75 rounded-1 border-2 border-solid px-1 py-0.75"
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
          tw="text-base"
          style={{
            color: selected && !disabled ? 'var(--color-text-2)' : undefined,
          }}
        >
          {title}
        </div>
        <div tw="text-tiny text-color-text-1">{description}</div>
      </div>
    </button>
  );
};
