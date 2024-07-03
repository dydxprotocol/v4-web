import React, { Dispatch, SetStateAction } from 'react';

import styled from 'styled-components';

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
      <$Rows>
        <$Row>
          <$Heading>{slotLeftHeading} </$Heading>
          <$Heading>{slotRightHeading} </$Heading>
        </$Row>
        <$Row>
          <$StakeBox> {slotLeft} </$StakeBox>
          <$ArrowIcon iconName={IconName.FastForward} />
          <$StakeBox> {slotRight} </$StakeBox>
        </$Row>
      </$Rows>
      <$Details items={detailItems} />
      <StakeConfirmationButtonRow
        setStakeFormStep={setCurrentStep}
        isLoading={isLoading}
        submitText={submitText}
      />
    </>
  );
};

const $Rows = styled.div`
  display: grid;
  gap: 0.5rem;
`;

const $Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: center;
  gap: 0.5rem;
`;

const $Heading = styled.h3`
  color: var(--color-text-0);
  font: var(--font-small-medium);

  flex-basis: 50%;
`;

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

const $ArrowIcon = styled(Icon)`
  width: 2.25rem;
  height: 2.25rem;
`;

const $Details = styled(Details)`
  --details-item-vertical-padding: 0.33rem;

  background-color: var(--withReceipt-backgroundColor);
  border-radius: 0.5em;
  font-size: var(--details-item-fontSize, 0.8125em);
  padding: 0.25rem 0.75rem;
`;
