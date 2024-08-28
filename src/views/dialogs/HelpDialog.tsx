import { useMemo } from 'react';

import styled from 'styled-components';

import { DialogProps, HelpDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { MenuConfig } from '@/constants/menus';
import { AppRoute, BASE_ROUTE } from '@/constants/routes';

import { useEnvConfig } from '@/hooks/useEnvConfig';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import breakpoints from '@/styles/breakpoints';

import { ComboboxDialogMenu } from '@/components/ComboboxDialogMenu';
import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { TermsOfUseLink } from '@/components/TermsOfUseLink';

import { isTruthy } from '@/lib/isTruthy';

const latestCommit = import.meta.env.VITE_LAST_ORIGINAL_COMMIT;
const latestVersion = import.meta.env.VITE_LAST_TAG;

export const HelpDialog = ({ setIsOpen }: DialogProps<HelpDialogProps>) => {
  const stringGetter = useStringGetter();
  const deployerName = useEnvConfig('deployerName');
  const {
    help: helpCenter,
    community,
    deployerTermsAndConditions,
    dydxLearnMore,
    tos,
  } = useURLConfigs();

  const HELP_ITEMS = useMemo(
    (): MenuConfig<string | number, string | number> => [
      {
        group: 'help-items',
        items: [
          helpCenter && {
            value: 'help-center',
            label: stringGetter({ key: STRING_KEYS.HELP_CENTER }),
            description: stringGetter({ key: STRING_KEYS.HELP_CENTER_DESCRIPTION }),
            onSelect: () => {
              if (helpCenter) {
                globalThis.open(helpCenter, '_blank');
              }
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
              if (community) {
                globalThis.open(community, '_blank');
              }
              setIsOpen(false);
            },
            slotBefore: <Icon iconName={IconName.Discord} />,
          },
        ].filter(isTruthy),
      },
    ],
    [stringGetter, helpCenter, community]
  );

  const legalDisclaimer = (
    <div tw="text-color-text-0 font-mini-book">
      {stringGetter({
        key: STRING_KEYS.SITE_OPERATED_BY_LONG,
        params: {
          NAME_OF_DEPLOYER: deployerName,
          DEPLOYER_TERMS_AND_CONDITIONS: (
            <Link
              isInline
              href={
                deployerTermsAndConditions && deployerTermsAndConditions !== ''
                  ? deployerTermsAndConditions
                  : `${BASE_ROUTE}${AppRoute.Terms}`
              }
            >
              {stringGetter({ key: STRING_KEYS.DEPLOYER_TERMS_AND_CONDITIONS })}
            </Link>
          ),
          TERMS_OF_USE: <TermsOfUseLink isInline hrefOverride={tos} />,
          LEARN_MORE_LINK: (
            <Link isInline href={dydxLearnMore}>
              {stringGetter({ key: STRING_KEYS.LEARN_MORE_ARROW })}
            </Link>
          ),
        },
      })}
    </div>
  );

  const maybeLatestCommit = latestCommit && (
    <span>
      Release - <span title={latestCommit}> {`${latestCommit.substring(0, 7)}`}</span>
    </span>
  );

  const maybeLatestVersion = latestVersion && (
    <span>
      Version - <span title={latestVersion}>{`${latestVersion.split(`release/v`).at(-1)}`}</span>
    </span>
  );

  return (
    <$ComboboxDialogMenu
      isOpen
      withSearch={false}
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.HELP })}
      items={HELP_ITEMS}
      slotFooter={
        <div tw="grid gap-1.5">
          {(maybeLatestCommit || maybeLatestVersion) && (
            <div tw="flex cursor-default select-text flex-col text-color-text-0">
              {maybeLatestCommit}
              {maybeLatestVersion}
            </div>
          )}
          {legalDisclaimer}
        </div>
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
