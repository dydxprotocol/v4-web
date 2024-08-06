import React, { Dispatch, SetStateAction } from 'react';

import styled from 'styled-components';
import tw from 'twin.macro';

import { StakeFormSteps } from '@/constants/stakingForms';

import { Details, DetailsItem } from '@/components/Details';
import { Icon, IconName } from '@/components/Icon';

import { StakeConfirmationButtonRow } from './StakeConfirmationButtonRow';

type ElementProps = {
  submitText: string;
  isLoading: boolean;
  slotLeftHeading: string;
  slotRightHeading: string;
  slotLeft: React.ReactNode;
  slotRight: React.ReactNode;
  detailItems: DetailsItem[];
  setCurrentStep: Dispatch<SetStateAction<StakeFormSteps>>;
};

export const StakePreviewContents = ({
  submitText,
  isLoading,
  slotLeftHeading,
  slotRightHeading,
  slotLeft,
  slotRight,
  detailItems,
  setCurrentStep,
}: ElementProps) => {
  return (
    <>
      <div tw="grid gap-0.5">
        <$Row>
          <$Heading>{slotLeftHeading} </$Heading>
          <$Heading>{slotRightHeading} </$Heading>
        </$Row>
        <$Row>
          <$StakeBox> {slotLeft} </$StakeBox>
          <Icon iconName={IconName.FastForward} tw="h-2.25 w-2.25" />
          <$StakeBox> {slotRight} </$StakeBox>
        </$Row>
      </div>
      <$Details items={detailItems} />
      <StakeConfirmationButtonRow
        setStakeFormStep={setCurrentStep}
        isLoading={isLoading}
        submitText={submitText}
      />
    </>
  );
};
const $Row = tw.div`flex items-center justify-between gap-0.5 text-center`;

const $Heading = tw.h3`basis-6/12 text-color-text-0 font-small-medium`;

const $StakeBox = styled.div`
  background-color: var(--color-layer-4);
  color: var(--color-text-1);
  font: var(--font-mini-medium);

  border-radius: 0.5rem;
  height: 100%;
  width: 100%;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 0.5rem;
`;
const $Details = styled(Details)`
  --details-item-vertical-padding: 0.33rem;

  background-color: var(--withReceipt-backgroundColor);
  border-radius: 0.5em;
  font-size: var(--details-item-fontSize, 0.8125em);
  padding: 0.25rem 0.75rem;
`;
