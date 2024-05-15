import { useMemo } from 'react';

import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter, useURLConfigs } from '@/hooks';

import { breakpoints } from '@/styles';

import { ComboboxDialogMenu } from '@/components/ComboboxDialogMenu';
import { Icon, IconName } from '@/components/Icon';

import { isTruthy } from '@/lib/isTruthy';

type ElementProps = {
  setIsOpen: (open: boolean) => void;
};

const latestCommit = import.meta.env.VITE_LAST_ORIGINAL_COMMIT;
const latestVersion = import.meta.env.VITE_LAST_TAG;

export const HelpDialog = ({ setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();
  const { help: helpCenter, community } = useURLConfigs();

  const HELP_ITEMS = useMemo(
    () => [
      {
        group: 'help-items',
        items: [
          helpCenter && {
            value: 'help-center',
            label: stringGetter({ key: STRING_KEYS.HELP_CENTER }),
            description: stringGetter({ key: STRING_KEYS.HELP_CENTER_DESCRIPTION }),
            onSelect: () => {
              helpCenter && globalThis.open(helpCenter, '_blank');
              setIsOpen(false);
            },
            slotBefore: <Icon iconName={IconName.File} />,
          },
          globalThis?.Intercom && {
            value: 'live-chat',
            label: stringGetter({ key: STRING_KEYS.LIVE_CHAT }),
            description: stringGetter({ key: STRING_KEYS.LIVE_CHAT_DESCRIPTION }),
            onSelect: () => {
              globalThis.Intercom('show');
              setIsOpen(false);
            },
            slotBefore: <Icon iconName={IconName.Chat} />,
          },
          community && {
            value: 'community',
            label: stringGetter({ key: STRING_KEYS.COMMUNITY }),
            description: stringGetter({ key: STRING_KEYS.COMMUNITY_DESCRIPTION }),
            onSelect: () => {
              community && globalThis.open(community, '_blank');
              setIsOpen(false);
            },
            slotBefore: <Icon iconName={IconName.Discord} />,
          },
        ].filter(isTruthy),
      },
    ],
    [stringGetter, helpCenter, community]
  );

  return (
    <$ComboboxDialogMenu
      isOpen
      withSearch={false}
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.HELP })}
      items={HELP_ITEMS}
      slotFooter={
        latestCommit || latestVersion ? (
          <$Footer>
            {latestCommit && (
              <span>
                Release - <span title={latestCommit}> {`${latestCommit.substring(0, 7)}`}</span>
              </span>
            )}
            {latestVersion && (
              <span>
                Version -{' '}
                <span title={latestVersion}>{`${latestVersion.split(`release/v`).at(-1)}`}</span>
              </span>
            )}
          </$Footer>
        ) : undefined
      }
    />
  );
};
const $ComboboxDialogMenu = styled(ComboboxDialogMenu)`
  --dialog-content-paddingTop: 1rem;
  --dialog-content-paddingBottom: 1rem;
  --comboxDialogMenu-item-gap: 1rem;

  @media ${breakpoints.notMobile} {
    --dialog-width: var(--dialog-small-width);
  }
`;

const $Footer = styled.div`
  display: flex;
  flex-direction: column;

  color: var(--color-text-0);
  cursor: default;
  user-select: text;
`;
