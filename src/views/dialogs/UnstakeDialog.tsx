import { useState } from 'react';

import { DialogProps, UnstakeDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { StakeFormSteps } from '@/constants/stakingForms';

import { useAccountBalance } from '@/hooks/useAccountBalance';
import { useStakingValidator } from '@/hooks/useStakingValidator';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

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
      description: React.ReactNode;
      slotIcon?: JSX.Element;
    };
  } = {
    [StakeFormSteps.EditInputs]: {
      title: stringGetter({ key: STRING_KEYS.UNSTAKE }),
      description: (
        <div tw="inlineRow">
          {currentDelegations?.length === 1
            ? stringGetter({
                key: STRING_KEYS.CURRENTLY_STAKING_WITH,
                params: {
                  VALIDATOR: (
                    <ValidatorName
                      validator={stakingValidators?.[currentDelegations[0].validator]?.[0]}
                      tw="inline-flex"
                    />
                  ),
                },
              })
            : stringGetter({
                key: STRING_KEYS.CURRENTLY_STAKING,
                params: {
                  AMOUNT: (
                    <span tw="text-text-1 inlineRow">
                      {nativeStakingBalance}
                      <Tag>{chainTokenLabel} </Tag>
                    </span>
                  ),
                },
              })}
        </div>
      ),
      slotIcon: <AssetIcon symbol={chainTokenLabel} />,
    },
    [StakeFormSteps.PreviewOrder]: {
      title: stringGetter({ key: STRING_KEYS.CONFIRM_UNSTAKE }),
      description: stringGetter({ key: STRING_KEYS.UNSTAKE_CONFIRMATION_DESCRIPTOR }),
    },
  };

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      slotIcon={dialogProps[currentStep].slotIcon}
      title={dialogProps[currentStep].title}
      description={dialogProps[currentStep].description}
      tw="[--dialog-content-paddingTop:var(--default-border-width)]"
    >
      <UnstakeForm currentStep={currentStep} setCurrentStep={setCurrentStep} onDone={closeDialog} />
    </Dialog>
  );
};
