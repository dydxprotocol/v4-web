import { useState } from 'react';

import styled, { css } from 'styled-components';

import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { DialogProps, MnemonicExportDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Checkbox } from '@/components/Checkbox';
import { CopyButton } from '@/components/CopyButton';
import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';
import { TimeoutButton } from '@/components/TimeoutButton';
import { ToggleButton } from '@/components/ToggleButton';
import { WithReceipt } from '@/components/WithReceipt';

enum MnemonicExportStep {
  AcknowledgeRisk = 'AcknowledgeRisk',
  DisplayMnemonic = 'DisplayMnemonic',
}

export const MnemonicExportDialog = ({ setIsOpen }: DialogProps<MnemonicExportDialogProps>) => {
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [currentStep, setCurrentStep] = useState(MnemonicExportStep.AcknowledgeRisk);
  const [isShowing, setIsShowing] = useState(false);

  const stringGetter = useStringGetter();

  const { hdKey } = useAccounts();
  const { mnemonic } = hdKey ?? {};

  const title = {
    [MnemonicExportStep.AcknowledgeRisk]: stringGetter({ key: STRING_KEYS.REVEAL_SECRET_PHRASE }),
    [MnemonicExportStep.DisplayMnemonic]: stringGetter({ key: STRING_KEYS.EXPORT_SECRET_PHRASE }),
  }[currentStep];

  const content = {
    [MnemonicExportStep.AcknowledgeRisk]: (
      <>
        <span tw="row gap-1 text-text-1">
          <$CautionIconContainer>
            <Icon iconName={IconName.CautionCircleStroked} />
          </$CautionIconContainer>

          <p>{stringGetter({ key: STRING_KEYS.SECRET_PHRASE_RISK })}</p>
        </span>
        <WithReceipt
          slotReceipt={
            <div tw="p-1 text-text-0">
              <Checkbox
                checked={hasAcknowledged}
                onCheckedChange={setHasAcknowledged}
                id="acknowledge-secret-phase-risk"
                label={stringGetter({
                  key: STRING_KEYS.SECRET_PHRASE_RISK_ACK,
                })}
              />
            </div>
          }
          tw="[--withReceipt-backgroundColor:var(--color-layer-2)]"
        >
          <TimeoutButton
            action={ButtonAction.Destroy}
            state={{ isDisabled: !hasAcknowledged }}
            onClick={() => setCurrentStep(MnemonicExportStep.DisplayMnemonic)}
            timeoutInSeconds={8}
          >
            {stringGetter({ key: STRING_KEYS.REVEAL_SECRET_PHRASE })}
          </TimeoutButton>
        </WithReceipt>
      </>
    ),
    [MnemonicExportStep.DisplayMnemonic]: (
      <>
        <AlertMessage type={AlertType.Error} tw="m-0 font-base-book">
          {stringGetter({ key: STRING_KEYS.NEVER_SHARE_PHRASE })}
        </AlertMessage>
        <$RevealControls>
          <span>
            {stringGetter({ key: isShowing ? STRING_KEYS.NOT_READY : STRING_KEYS.READY })}
          </span>
          <ToggleButton
            size={ButtonSize.Small}
            isPressed={isShowing}
            onPressedChange={setIsShowing}
            slotLeft={<Icon iconName={!isShowing ? IconName.Show : IconName.Hide} />}
          >
            {stringGetter({
              key: !isShowing ? STRING_KEYS.SHOW_PHRASE : STRING_KEYS.HIDE_PHRASE,
            })}
          </ToggleButton>
        </$RevealControls>
        <WithReceipt
          slotReceipt={
            <$WordList
              data-hj-suppress
              isShowing={isShowing}
              onClick={() => setIsShowing(!isShowing)}
            >
              <$List>
                {mnemonic?.split(' ').map((word: string, i: number) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <$Word key={i}>
                    <span>{isShowing ? word : '*****'}</span>
                  </$Word>
                ))}
              </$List>
              <span>{stringGetter({ key: STRING_KEYS.CLICK_TO_SHOW })}</span>
            </$WordList>
          }
        >
          <CopyButton value={mnemonic} />
        </WithReceipt>
      </>
    ),
  }[currentStep];

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={title}
      description={stringGetter({ key: STRING_KEYS.REVEAL_SECRET_PHRASE_DESCRIPTION })}
      tw="notMobile:[--dialog-width:30rem]"
    >
      <div tw="column gap-1">{content}</div>
    </Dialog>
  );
};
const $CautionIconContainer = styled.div`
  ${layoutMixins.stack}
  min-width: 2.5rem;
  height: 2.5rem;
  align-items: center;
  border-radius: 50%;
  overflow: hidden;
  color: var(--color-error);

  svg {
    width: 1.125em;
    height: 1.125em;
    justify-self: center;
  }

  &:before {
    content: '';
    width: 2.5rem;
    height: 2.5rem;
    background-color: var(--color-gradient-error);
  }
`;
const $RevealControls = styled.div`
  ${layoutMixins.spacedRow}

  svg {
    width: auto;
  }
`;

const $WordList = styled.div<{ isShowing?: boolean }>`
  ${layoutMixins.stack}
  transition: 0.2s;
  cursor: pointer;
  padding: 1rem;

  &:hover {
    filter: brightness(var(--hover-filter-base));
  }

  > :first-child {
    ${({ isShowing }) =>
      !isShowing &&
      css`
        filter: blur(1rem) brightness(1.4);
        will-change: filter;
        transform: scale(0.66);
      `}
  }

  > span {
    place-self: center;

    font: var(--font-base-book);
    color: var(--color-text-2);

    ${({ isShowing }) =>
      isShowing &&
      css`
        opacity: 0;
      `}
  }
`;

const $List = styled.ol`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.25rem;
  list-style: none;
  counter-reset: word;
`;

const $Word = styled.li`
  font: var(--font-base-book);
  font-family: var(--fontFamily-monospace);

  &::before {
    width: 2rem;
    font-family: var(--fontFamily-base);
    font-feature-settings: var(--fontFeature-monoNumbers);
    counter-increment: word;
    content: counter(word) '. ';

    display: inline-block;
    color: var(--color-text-0);
    text-align: end;
    margin-right: 0.25rem;
  }
`;
