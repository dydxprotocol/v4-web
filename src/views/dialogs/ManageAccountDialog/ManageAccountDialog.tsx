import { useState } from 'react';

import styled from 'styled-components';

import { DialogProps, ManageAccountDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';
import { PrivateTag } from '@/components/Tag';

import { useAppSelector } from '@/state/appTypes';
import { selectTurnkeyWalletInfo } from '@/state/walletSelectors';

import { RevealPhrase } from './RevealPhrase';

const ManagementSection = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <$ManagementSection>
    <div tw="flexColumn mb-1 gap-0.25">
      <span tw="text-color-text-1 font-base-book">{title}</span>
      <span tw="text-color-text-0 font-small-book">{description}</span>
    </div>

    {children}
  </$ManagementSection>
);

type AccountManagementPage = 'default' | 'dydxExport' | 'turnkeyExport';

export const ManageAccountDialog = ({ setIsOpen }: DialogProps<ManageAccountDialogProps>) => {
  const stringGetter = useStringGetter();
  const [page, setPage] = useState<AccountManagementPage>('default');
  const turnkeyWalletInfo = useAppSelector(selectTurnkeyWalletInfo);

  const emailSection = turnkeyWalletInfo?.userEmail && (
    <ManagementSection
      title={stringGetter({ key: STRING_KEYS.EMAIL })}
      description={stringGetter({ key: STRING_KEYS.EMAIL_DESC })}
    >
      <div tw="row rounded-[0.75rem] bg-color-layer-2 px-1 py-0.75">
        <Icon iconName={IconName.EmailStroke} tw="mr-0.75 size-1.25 text-color-text-0" />
        {turnkeyWalletInfo.userEmail}
      </div>
    </ManagementSection>
  );

  const exportSection = (
    <ManagementSection
      title={stringGetter({ key: STRING_KEYS.EXPORT })}
      description={stringGetter({ key: STRING_KEYS.EXPORT_PHRASE_DESC })}
    >
      <div tw="flexColumn gap-1">
        <button
          type="button"
          tw="row gap-0.25 rounded-[0.75rem] bg-color-layer-2 px-1 py-0.75"
          onClick={() => setPage('turnkeyExport')}
        >
          {stringGetter({ key: STRING_KEYS.REVEAL_TURNKEY_PHRASE })}
          <PrivateTag tw="rounded-[360px] px-0.5 font-tiny-bold">
            {stringGetter({ key: STRING_KEYS.PRIVATE })}
          </PrivateTag>
          <Icon
            iconName={IconName.ChevronRight}
            tw="ml-auto text-color-text-0"
            css={{
              '--icon-size': '0.75rem',
            }}
          />
        </button>

        <button
          type="button"
          tw="row gap-0.25 rounded-[0.75rem] bg-color-layer-2 px-1 py-0.75"
          onClick={() => setPage('dydxExport')}
        >
          {stringGetter({ key: STRING_KEYS.REVEAL_DYDX_PHRASE })}
          <PrivateTag tw="rounded-[360px] px-0.5 font-tiny-bold">
            {stringGetter({ key: STRING_KEYS.PRIVATE })}
          </PrivateTag>
          <Icon
            iconName={IconName.ChevronRight}
            tw="ml-auto size-0.5 text-color-text-0"
            css={{
              '--icon-size': '0.75rem',
            }}
          />
        </button>
      </div>
    </ManagementSection>
  );

  const onBack = page === 'default' ? undefined : () => setPage('default');

  const content = {
    default: (
      <div tw="flexColumn gap-1.5">
        {emailSection}
        {exportSection}
      </div>
    ),
    dydxExport: (
      <RevealPhrase
        exportWalletType="dydx"
        closeDialog={() => setIsOpen(false)}
        onBack={() => setPage('default')}
      />
    ),
    turnkeyExport: (
      <RevealPhrase
        exportWalletType="turnkey"
        closeDialog={() => setIsOpen(false)}
        onBack={() => setPage('default')}
      />
    ),
  }[page];

  const title = {
    default: stringGetter({ key: STRING_KEYS.ACCOUNT_MANAGEMENT }),
    dydxExport: stringGetter({ key: STRING_KEYS.REVEAL_SECRET_PHRASE }),
    turnkeyExport: stringGetter({ key: STRING_KEYS.REVEAL_SECRET_PHRASE }),
  }[page];

  return (
    <$Dialog onBack={onBack} isOpen setIsOpen={setIsOpen} title={title} $page={page}>
      {content}
    </$Dialog>
  );
};

const $Dialog = styled(Dialog)<{ $page: AccountManagementPage }>`
  --dialog-backgroundColor: var(--color-layer-1);

  @media ${breakpoints.notMobile} {
    --dialog-width: ${({ $page }) => ($page === 'default' ? '39.5rem' : '26.25rem')};
  }
`;

const $ManagementSection = styled.div`
  ${layoutMixins.flexColumn}
`;
