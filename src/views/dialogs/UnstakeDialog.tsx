import { useState } from 'react';

import styled from 'styled-components';

import { DialogProps, UnstakeDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { StakeFormSteps } from '@/constants/stakingForms';

import { useAccountBalance } from '@/hooks/useAccountBalance';
import { useStakingValidator } from '@/hooks/useStakingValidator';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Dialog } from '@/components/Dialog';
import { Tag } from '@/components/Tag';
import { UnstakeForm } from '@/views/forms/StakingForms/UnstakeForm';
import { ValidatorName } from '@/views/forms/StakingForms/shared/ValidatorName';

export const UnstakeDialog = ({ setIsOpen }: DialogProps<UnstakeDialogProps>) => {
  const stringGetter = useStringGetter();

  const [currentStep, setCurrentStep] = useState<StakeFormSteps>(StakeFormSteps.EditInputs);

  const { nativeStakingBalance } = useAccountBalance();
  const { stakingValidators, currentDelegations } = useStakingValidator() ?? {};
  const { chainTokenLabel } = useTokenConfigs();

  const closeDialog = () => setIsOpen?.(false);

  const dialogProps: {
    [key in StakeFormSteps]: {
      title: string;
      description: string;
      slotIcon?: JSX.Element;
    };
  } = {
    [StakeFormSteps.EditInputs]: {
      title: stringGetter({ key: STRING_KEYS.UNSTAKE }),
      description:
        currentDelegations?.length === 1
          ? stringGetter({
              key: STRING_KEYS.CURRENTLY_STAKING_WITH,
              params: {
                VALIDATOR: (
                  <ValidatorName
                    validator={stakingValidators?.[currentDelegations[0].validator]?.[0]}
                  />
                ),
              },
            })
          : stringGetter({
              key: STRING_KEYS.CURRENTLY_STAKING,
              params: {
                AMOUNT: (
                  <$StakedAmount>
                    {nativeStakingBalance}
                    <Tag>{chainTokenLabel} </Tag>
                  </$StakedAmount>
                ),
              },
            }),
      slotIcon: <AssetIcon symbol={chainTokenLabel} />,
    },
    [StakeFormSteps.PreviewOrder]: {
      title: stringGetter({ key: STRING_KEYS.CONFIRM_UNSTAKE }),
      description: stringGetter({ key: STRING_KEYS.UNSTAKE_CONFIRMATION_DESCRIPTOR }),
    },
  };

  return (
    <$Dialog
      isOpen
      setIsOpen={setIsOpen}
      slotIcon={dialogProps[currentStep].slotIcon}
      title={dialogProps[currentStep].title}
      description={dialogProps[currentStep].description}
    >
      <UnstakeForm currentStep={currentStep} setCurrentStep={setCurrentStep} onDone={closeDialog} />
    </$Dialog>
  );
};

const $Dialog = styled(Dialog)`
  --dialog-content-paddingTop: var(--default-border-width);
`;

const $StakedAmount = styled.span`
  ${layoutMixins.inlineRow}
  color: var(--color-text-1);
`;
