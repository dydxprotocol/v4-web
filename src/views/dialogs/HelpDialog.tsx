import { useMemo } from 'react';
import styled, { AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { useStringGetter } from '@/hooks';
import { ChatIcon, FeedbackIcon, FileIcon, TerminalIcon } from '@/icons';

import { ComboboxDialogMenu } from '@/components/ComboboxDialogMenu';

import { isTruthy } from '@/lib/isTruthy';

type ElementProps = {
  setIsOpen: (open: boolean) => void;
};

const HELP_LINKS = {
  apiDocumentation: 'https://v4-teacher.vercel.app/',
  helpCenter: null,
  feedback: `https://docs.google.com/forms/d/e/1FAIpQLSezLsWCKvAYDEb7L-2O4wOON1T56xxro9A2Azvl6IxXHP_15Q/viewform?usp=sf_link`,
};

export const HelpDialog = ({ setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();

  const HELP_ITEMS = useMemo(
    () => [
      {
        group: 'help-items',
        items: [
          HELP_LINKS.helpCenter && {
            value: 'help-center',
            label: stringGetter({ key: STRING_KEYS.HELP_CENTER }),
            description: stringGetter({ key: STRING_KEYS.HELP_CENTER_DESCRIPTION }),
            onSelect: () => {
              HELP_LINKS.helpCenter && globalThis.open(HELP_LINKS.helpCenter, '_blank');
              setIsOpen(false);
            },
            slotBefore: <FileIcon />,
          },
          {
            value: 'api-documentation',
            label: stringGetter({ key: STRING_KEYS.API_DOCUMENTATION }),
            description: stringGetter({ key: STRING_KEYS.API_DOCUMENTATION_DESCRIPTION }),
            onSelect: () => {
              globalThis.open(HELP_LINKS.apiDocumentation, '_blank');
              setIsOpen(false);
            },
            slotBefore: <TerminalIcon />,
          },
          globalThis?.Intercom && {
            value: 'live-chat',
            label: stringGetter({ key: STRING_KEYS.LIVE_CHAT }),
            description: stringGetter({ key: STRING_KEYS.LIVE_CHAT_DESCRIPTION }),
            onSelect: () => {
              globalThis.Intercom('show');
              setIsOpen(false);
            },
            slotBefore: <ChatIcon />,
          },
          {
            value: 'feedback',
            label: stringGetter({ key: STRING_KEYS.PROVIDE_FEEDBACK }),
            description: stringGetter({ key: STRING_KEYS.PROVIDE_FEEDBACK_DESCRIPTION }),
            onSelect: () => {
              globalThis.open(HELP_LINKS.feedback, '_blank');
              setIsOpen(false);
            },
            slotBefore: <FeedbackIcon />,
          },
        ].filter(isTruthy),
      },
    ],
    [stringGetter]
  );

  return (
    <Styled.ComboboxDialogMenu
      isOpen
      withSearch={false}
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.HELP })}
      items={HELP_ITEMS}
    />
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.ComboboxDialogMenu = styled(ComboboxDialogMenu)`
  --dialog-width: var(--dialog-small-width);
  --dialog-content-paddingTop: 1rem;
  --dialog-content-paddingBottom: 1rem;
  --comboxDialogMenu-item-gap: 1rem;
`;
