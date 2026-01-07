import { Dispatch, SetStateAction } from 'react';

import { NumberFormatValues, NumericFormat } from 'react-number-format';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Output, OutputType } from '@/components/Output';

type SpotAmountInputProps = {
  amount: string;
  setAmount: Dispatch<SetStateAction<string>>;
  solBalance: string | undefined;
  maxWithdrawable: number | undefined;
  isPending: boolean;
};

export const SpotAmountInput = ({
  amount,
  setAmount,
  solBalance,
  maxWithdrawable,
  isPending,
}: SpotAmountInputProps) => {
  const stringGetter = useStringGetter();

  const onClickMax = () => {
    if (maxWithdrawable) {
      setAmount(maxWithdrawable.toString());
    }
  };

  return (
    <div tw="flex items-center justify-between gap-0.5 rounded-0.75 border border-solid border-color-border bg-color-layer-4 px-1.25 py-0.75">
      <div tw="flex flex-1 flex-col gap-0.5 text-small">
        <div>
          {stringGetter({ key: STRING_KEYS.AMOUNT })}

          {solBalance && (
            <>
              <span> • </span>
              <Output
                tw="inline font-medium text-color-text-0"
                fractionDigits={4}
                slotRight={` SOL ${stringGetter({ key: STRING_KEYS.AVAILABLE })}`}
                value={solBalance}
                type={OutputType.Number}
              />
            </>
          )}

          {maxWithdrawable !== undefined && maxWithdrawable > 0 && (
            <>
              <span> • </span>
              <button
                disabled={!maxWithdrawable || isPending}
                onClick={onClickMax}
                type="button"
                tw="font-medium"
                style={{
                  color:
                    !maxWithdrawable || isPending ? 'var(--color-text-0)' : 'var(--color-accent)',
                }}
              >
                {stringGetter({ key: STRING_KEYS.MAX })}
              </button>
            </>
          )}
        </div>
        <$NumericFormat
          valueIsNumericString
          allowNegative={false}
          placeholder="0.00"
          value={amount}
          onValueChange={(values: NumberFormatValues) => {
            setAmount(values.value);
          }}
        />
      </div>
    </div>
  );
};

const $NumericFormat = styled(NumericFormat)`
  font: var(--font-large-medium);
  background-color: var(--color-layer-4);
  color: var(--color-text-2);
  outline: none;
`;
