import { Dispatch, SetStateAction } from 'react';

import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { StakeFormSteps } from '@/constants/stakingForms';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

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
    <$Row>
      <$EditButton
        action={ButtonAction.Base}
        onClick={() => setStakeFormStep(StakeFormSteps.EditInputs)}
      >
        {stringGetter({ key: STRING_KEYS.EDIT })}
      </$EditButton>
      <$SubmitButton action={ButtonAction.Primary} type={ButtonType.Submit} state={{ isLoading }}>
        {submitText}
      </$SubmitButton>
    </$Row>
  ) : (
    <$OnboardingTriggerButton size={ButtonSize.Base} />
  );
};

const $Row = styled.div`
  ${layoutMixins.inlineRow}
  gap: 1rem;
  width: 100%;
`;

const $EditButton = styled(Button)`
  flex-grow: 1;
`;

const $SubmitButton = styled(Button)`
  flex-grow: 3;
`;

const $OnboardingTriggerButton = styled(OnboardingTriggerButton)`
  width: 100%;
`;
