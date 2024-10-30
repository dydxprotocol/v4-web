import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Icon, IconName } from '@/components/Icon';

type ElementProps = {
  onToggle: () => void;
};

export const FunkitToggle = ({ onToggle }: ElementProps) => {
  const stringGetter = useStringGetter();

  return (
    <div tw="flex w-full rounded-0.5 bg-color-layer-4">
      <button
        tw="flex w-1/2 flex-col items-start justify-center px-1 py-0.5 text-color-text-0"
        onClick={onToggle}
        type="button"
      >
        <div tw="flex w-full items-center justify-between font-medium-regular">
          {stringGetter({ key: STRING_KEYS.INSTANT })}
          <Icon iconName={IconName.FunkitInstant} tw="float-right" />
        </div>
        <div tw="font-small-regular">{stringGetter({ key: STRING_KEYS.HIGHER_FEES })}</div>
      </button>
      <div tw="flex w-1/2 flex-col items-start justify-center rounded-0.5 border-2 border-solid border-color-accent bg-color-layer-1 px-1 py-0.5">
        <div tw="flex w-full items-center justify-between font-medium-regular">
          {stringGetter({ key: STRING_KEYS.STANDARD })}
          <Icon iconName={IconName.FunkitStandard} tw="float-right text-color-accent" />
        </div>
        <div tw="font-small-regular">{stringGetter({ key: STRING_KEYS.LOWEST_FEES })}</div>
      </div>
    </div>
  );
};
