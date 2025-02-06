import { EventHandler } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { SyntheticInputEvent } from 'react-number-format/types/types';

import { STRING_KEYS } from '@/constants/localization';
import { USDC_DECIMALS } from '@/constants/tokens';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Output, OutputType } from '@/components/Output';

import { useAppSelector } from '@/state/appTypes';

import { orEmptyObj } from '@/lib/typeUtils';

type AmountInputProps = {
  value: string;
  onChange: (newValue: string) => void;
};

export const AmountInput = ({ value, onChange }: AmountInputProps) => {
  const stringGetter = useStringGetter();

  const onValueChange: EventHandler<SyntheticInputEvent> = (e) => {
    onChange(e.target.value);
  };

  const isLoading =
    useAppSelector(BonsaiCore.account.parentSubaccountSummary.loading) === 'pending';

  const { freeCollateral } = orEmptyObj(
    useAppSelector(BonsaiCore.account.parentSubaccountSummary.data)
  );

  const onClickMax = () => {
    if (!freeCollateral) return;
    onChange(freeCollateral.toString());
  };

  const onMaxDisabled = !freeCollateral || isLoading;

  return (
    <div tw="flex items-center justify-between gap-0.5 rounded-0.75 border border-solid border-color-border bg-color-layer-4 px-1.25 py-0.75">
      <div tw="flex flex-1 flex-col gap-0.5 text-small">
        <div>
          {stringGetter({ key: STRING_KEYS.AMOUNT })}

          {freeCollateral && (
            <>
              <span> • </span>
              <Output
                tw="inline font-medium text-color-text-0"
                fractionDigits={USDC_DECIMALS}
                slotRight={` ${stringGetter({ key: STRING_KEYS.AVAILABLE })}`}
                value={freeCollateral}
                type={OutputType.Fiat}
              />
            </>
          )}

          {freeCollateral && (
            <>
              <span> • </span>
              <button
                disabled={onMaxDisabled}
                onClick={onClickMax}
                type="button"
                tw="font-medium"
                style={{ color: onMaxDisabled ? 'var(--color-text-0)' : 'var(--color-accent)' }}
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
          value={value}
          onChange={onValueChange}
        />
      </div>
    </div>
  );
};
