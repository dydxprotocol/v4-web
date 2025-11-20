import { Dispatch, SetStateAction } from 'react';

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
        <input
          type="number"
          placeholder="0.00"
          tw="flex-1 bg-color-layer-4 text-large font-medium outline-none"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
    </div>
  );
};
