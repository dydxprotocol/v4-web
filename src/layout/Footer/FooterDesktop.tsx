import styled, { css } from 'styled-components';

import { AbacusApiStatus } from '@/constants/abacus';
import { ButtonSize, ButtonType } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { isDev } from '@/constants/networks';

import { useApiState } from '@/hooks/useApiState';
import { useEnvConfig } from '@/hooks/useEnvConfig';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { ChatIcon, LinkOutIcon } from '@/icons';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { Link } from '@/components/Link';
import { Output, OutputType } from '@/components/Output';
import { WithTooltip } from '@/components/WithTooltip';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { isPresent } from '@/lib/typeUtils';

enum FooterItems {
  ChainHeight,
  IndexerHeight,
}

enum ExchangeStatus {
  Operational = 'Operational',
  Degraded = 'Degraded',
}

export const FooterDesktop = () => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const { height, indexerHeight, status, statusErrorMessage } = useApiState();
  const deployerName = useEnvConfig('deployerName');
  const { statusPage } = useURLConfigs();

  const isStatusLoading = !status && !statusErrorMessage;

  const { exchangeStatus, label } = isStatusLoading
    ? {
        exchangeStatus: undefined,
        label: stringGetter({ key: STRING_KEYS.CONNECTING }),
      }
    : status === AbacusApiStatus.NORMAL
      ? {
          exchangeStatus: ExchangeStatus.Operational,
          label: stringGetter({ key: STRING_KEYS.OPERATIONAL }),
        }
      : {
          exchangeStatus: ExchangeStatus.Degraded,
          label: stringGetter({ key: STRING_KEYS.DEGRADED }),
        };

  return (
    <$Footer>
      <$Row>
        <WithTooltip
          slotTooltip={
            statusErrorMessage && (
              <dl>
                <dd>{statusErrorMessage.body}</dd>
              </dl>
            )
          }
        >
          <$FooterButton
            type={statusPage ? ButtonType.Link : ButtonType.Button}
            slotLeft={<$StatusDot exchangeStatus={exchangeStatus} />}
            slotRight={statusPage && <LinkOutIcon />}
            size={ButtonSize.XSmall}
            state={{ isDisabled: !statusPage }}
            href={statusPage}
          >
            {label}
          </$FooterButton>
        </WithTooltip>

        {globalThis?.Intercom && (
          <$FooterButton
            slotLeft={<ChatIcon />}
            size={ButtonSize.XSmall}
            onClick={() => globalThis.Intercom('show')}
          >
            {stringGetter({ key: STRING_KEYS.HELP_AND_SUPPORT })}
          </$FooterButton>
        )}
        <$FooterItem>
          {stringGetter({
            key: STRING_KEYS.SITE_OPERATED_BY_SHORT,
            params: {
              NAME_OF_DEPLOYER: deployerName,
              LEARN_MORE_LINK: (
                <Link onClick={() => dispatch(openDialog(DialogTypes.Help()))}>
                  {stringGetter({ key: STRING_KEYS.LEARN_MORE })}
                </Link>
              ),
            },
          })}
        </$FooterItem>
      </$Row>

      {isDev && (
        <$Details
          withSeparators
          items={[
            {
              key: FooterItems.ChainHeight.toString(),
              label: 'Block Height',
              value: <Output useGrouping type={OutputType.Number} value={height} />,
            },
            height !== indexerHeight
              ? {
                  key: FooterItems.IndexerHeight.toString(),
                  label: 'Indexer Block Height',
                  value: (
                    <Output
                      useGrouping
                      type={OutputType.Number}
                      value={indexerHeight}
                      tw="text-color-warning"
                    />
                  ),
                }
              : undefined,
          ].filter(isPresent)}
          layout="row"
        />
      )}
    </$Footer>
  );
};
const $Footer = styled.footer`
  ${layoutMixins.stickyFooter}
  ${layoutMixins.spacedRow}
  grid-area: Footer;
`;

const $Row = styled.div`
  ${layoutMixins.row}
  ${layoutMixins.spacedRow}

  padding: 0 0.5rem;
  > * {
    border-right: 1px solid var(--color-border);
  }
`;

const $StatusDot = styled.div<{ exchangeStatus?: ExchangeStatus }>`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  margin-right: 0.25rem;
  background-color: var(--color-text-0);

  background-color: ${({ exchangeStatus }) =>
    exchangeStatus &&
    {
      [ExchangeStatus.Degraded]: css`var(--color-warning)`,
      [ExchangeStatus.Operational]: css`var(--color-success)`,
    }[exchangeStatus]};
`;

const $FooterButton = styled(Button)`
  --button-height: 1.5rem;
  --button-radius: 0.25rem;
  --button-backgroundColor: transparent;
  --button-border: none;
  --button-textColor: var(--color-text-0);

  &:hover:not(:disabled) {
    --button-backgroundColor: var(--color-layer-3);
    --button-textColor: var(--color-text-1);
  }

  &:disabled {
    cursor: default;
  }
`;

const $FooterItem = styled.div`
  font: var(--font-mini-book);
  color: var(--color-text-0);

  display: inline-flex;
  padding: 0 0.625rem;
`;

const $Details = styled(Details)`
  ${layoutMixins.scrollArea}
  font: var(--font-tiny-book);
`;
