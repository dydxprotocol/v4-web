import { Dispatch, SetStateAction } from 'react';

import { shallowEqual } from 'react-redux';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { StakeFormSteps } from '@/constants/stakingForms';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { useAppSelector } from '@/state/appTypes';

type ElementProps = {
  setStakeFormStep: Dispatch<SetStateAction<StakeFormSteps>>;
  isLoading: boolean;
  submitText: string;
};

export const StakeConfirmationButtonRow = ({
  setStakeFormStep,
  isLoading,
  submitText,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const canAccountTrade = useAppSelector(calculateCanAccountTrade, shallowEqual);

  return canAccountTrade ? (
    <div tw="w-full gap-1 inlineRow">
      <Button
        action={ButtonAction.Base}
        onClick={() => setStakeFormStep(StakeFormSteps.EditInputs)}
        tw="grow"
      >
        {stringGetter({ key: STRING_KEYS.EDIT })}
      </Button>
      <Button
        action={ButtonAction.Primary}
        type={ButtonType.Submit}
        state={{ isLoading }}
        tw="grow-[3]"
      >
        {submitText}
      </Button>
    </div>
  ) : (
    <OnboardingTriggerButton size={ButtonSize.Base} tw="w-full" />
  );
};
