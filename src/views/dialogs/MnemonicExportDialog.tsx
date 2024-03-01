import { useState } from 'react';

import styled, { AnyStyledComponent, css } from 'styled-components';

import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useAccounts, useStringGetter } from '@/hooks';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Checkbox } from '@/components/Checkbox';
import { CopyButton } from '@/components/CopyButton';
import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';
import { TimeoutButton } from '@/components/TimeoutButton';
import { ToggleButton } from '@/components/ToggleButton';
import { WithReceipt } from '@/components/WithReceipt';

type ElementProps = {
  setIsOpen: (open: boolean) => void;
};

enum MnemonicExportStep {
  AcknowledgeRisk = 'AcknowledgeRisk',
  DisplayMnemonic = 'DisplayMnemonic',
}

export const MnemonicExportDialog = ({ setIsOpen }: ElementProps) => {
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
        <Styled.WaitingSpan>
          <Styled.CautionIconContainer>
            <Icon iconName={IconName.CautionCircleStroked} />
          </Styled.CautionIconContainer>

          <p>{stringGetter({ key: STRING_KEYS.SECRET_PHRASE_RISK })}</p>
        </Styled.WaitingSpan>
        <Styled.WithReceipt
          slotReceipt={
            <Styled.CheckboxContainer>
              <Checkbox
                checked={hasAcknowledged}
                onCheckedChange={setHasAcknowledged}
                id="acknowledge-secret-phase-risk"
                label={stringGetter({
                  key: STRING_KEYS.SECRET_PHRASE_RISK_ACK,
                })}
              />
            </Styled.CheckboxContainer>
          }
        >
          <TimeoutButton
            action={ButtonAction.Destroy}
            state={{ isDisabled: !hasAcknowledged }}
            onClick={() => setCurrentStep(MnemonicExportStep.DisplayMnemonic)}
            timeoutInSeconds={8}
          >
            {stringGetter({ key: STRING_KEYS.REVEAL_SECRET_PHRASE })}
          </TimeoutButton>
        </Styled.WithReceipt>
      </>
    ),
    [MnemonicExportStep.DisplayMnemonic]: (
      <>
        <Styled.AlertMessage type={AlertType.Error}>
          {stringGetter({ key: STRING_KEYS.NEVER_SHARE_PHRASE })}
        </Styled.AlertMessage>
        <Styled.RevealControls>
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
        </Styled.RevealControls>
        <WithReceipt
          slotReceipt={
            <Styled.WordList isShowing={isShowing} onClick={() => setIsShowing(!isShowing)}>
              <Styled.List>
                {mnemonic?.split(' ').map((word: string, i: number) => (
                  <Styled.Word key={i}>
                    <span>{isShowing ? word : '*****'}</span>
                  </Styled.Word>
                ))}
              </Styled.List>
              <span>{stringGetter({ key: STRING_KEYS.CLICK_TO_SHOW })}</span>
            </Styled.WordList>
          }
        >
          <CopyButton value={mnemonic} />
        </WithReceipt>
      </>
    ),
  }[currentStep];

  return (
    <Styled.Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={title}
      description={stringGetter({ key: STRING_KEYS.REVEAL_SECRET_PHRASE_DESCRIPTION })}
    >
      <Styled.Content>{content}</Styled.Content>
    </Styled.Dialog>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.WaitingSpan = styled.span`
  ${layoutMixins.row}
  gap: 1rem;
  color: var(--color-text-1);
`;

Styled.CautionIconContainer = styled.div`
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

Styled.WithReceipt = styled(WithReceipt)`
  --withReceipt-backgroundColor: var(--color-layer-2);
`;

Styled.CheckboxContainer = styled.div`
  padding: 1rem;
  color: var(--color-text-0);
`;

Styled.AlertMessage = styled(AlertMessage)`
  font: var(--font-base-book);
  margin: 0;
`;

Styled.RevealControls = styled.div`
  ${layoutMixins.spacedRow}

  svg {
    width: auto;
  }
`;

Styled.WordList = styled.div<{ isShowing?: boolean }>`
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

Styled.List = styled.ol`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.25rem;
  list-style: none;
  counter-reset: word;
`;

Styled.Word = styled.li`
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

Styled.Dialog = styled(Dialog)`
  @media ${breakpoints.notMobile} {
    --dialog-width: 30rem;
  }
`;

Styled.Content = styled.div`
  ${layoutMixins.column}
  gap: 1rem;
`;
