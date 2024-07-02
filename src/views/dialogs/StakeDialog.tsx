import { useState } from 'react';

import styled from 'styled-components';

import { DialogProps, DialogTypes, StakeDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { StakeFormSteps } from '@/constants/stakingForms';

import { useStakingAPR } from '@/hooks/useStakingAPR';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Dialog } from '@/components/Dialog';
import { Link } from '@/components/Link';
import { Output, OutputType } from '@/components/Output';
import { Tag, TagSign } from '@/components/Tag';
import { StakeForm } from '@/views/forms/StakingForms/StakeForm';

import { useAppDispatch } from '@/state/appTypes';
import { forceOpenDialog } from '@/state/dialogs';

export const StakeDialog = ({ setIsOpen }: DialogProps<StakeDialogProps>) => {
  const stringGetter = useStringGetter();
  const { chainTokenLabel } = useTokenConfigs();
  const stakingApr = useStakingAPR();

  const [currentStep, setCurrentStep] = useState<StakeFormSteps>(StakeFormSteps.EditInputs);

  const closeDialog = () => setIsOpen?.(false);

  const dialogProps: {
    [key in StakeFormSteps]: {
      title: string;
      description: string;
      slotIcon?: JSX.Element;
    };
  } = {
    [StakeFormSteps.EditInputs]: {
      title: stringGetter({ key: STRING_KEYS.STAKE }),
      description: stringGetter({ key: STRING_KEYS.STAKE_DESCRIPTION }),
      slotIcon: <AssetIcon symbol={chainTokenLabel} />,
    },
    [StakeFormSteps.PreviewOrder]: {
      title: stringGetter({ key: STRING_KEYS.CONFIRM_STAKE }),
      description: stringGetter({ key: STRING_KEYS.STAKE_CONFIRMATION_DESCRIPTOR }),
    },
  };

  return (
    <$Dialog
      isOpen
      setIsOpen={setIsOpen}
      slotIcon={dialogProps[currentStep].slotIcon}
      slotFooter={<LegalDisclaimer />}
      title={
        <$Title>
          {dialogProps[currentStep].title}
          {stakingApr && (
            <$Tag sign={TagSign.Positive}>
              {stringGetter({
                key: STRING_KEYS.EST_APR,
                params: { PERCENTAGE: <$Output type={OutputType.Percent} value={stakingApr} /> },
              })}
            </$Tag>
          )}
        </$Title>
      }
      description={dialogProps[currentStep].description}
    >
      <StakeForm currentStep={currentStep} setCurrentStep={setCurrentStep} onDone={closeDialog} />
    </$Dialog>
  );
};

const LegalDisclaimer = () => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const openKeplrDialog = () => dispatch(forceOpenDialog(DialogTypes.ExternalNavKeplr()));
  const openStrideDialog = () => dispatch(forceOpenDialog(DialogTypes.ExternalNavStride()));

  return (
    <$LegalDisclaimer>
      {stringGetter({
        key: STRING_KEYS.STAKING_LEGAL_DISCLAIMER_WITH_DEFAULT,
        params: {
          KEPLR_DASHBOARD_LINK: (
            <$Link withIcon onClick={openKeplrDialog}>
              {stringGetter({ key: STRING_KEYS.KEPLR_DASHBOARD })}
            </$Link>
          ),
          STRIDE_LINK: (
            <$Link withIcon onClick={openStrideDialog}>
              Stride
            </$Link>
          ),
        },
      })}
    </$LegalDisclaimer>
  );
};

const $Dialog = styled(Dialog)`
  --dialog-content-paddingTop: var(--default-border-width);
  --dialog-content-paddingBottom: 1rem;
`;

const $Title = styled.span`
  ${layoutMixins.inlineRow}
`;

const $Tag = styled(Tag)`
  display: inline-block;
`;

const $Output = styled(Output)`
  display: inline-block;
`;

const $LegalDisclaimer = styled.div`
  text-align: center;
  color: var(--color-text-0);
  font: var(--font-mini-book);
`;

const $Link = styled(Link)`
  --link-color: var(--color-text-1);
  display: inline-flex;
`;
