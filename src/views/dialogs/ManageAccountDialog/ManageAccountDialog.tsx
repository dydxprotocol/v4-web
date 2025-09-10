import { useState } from 'react';

import styled from 'styled-components';

import { DialogProps, ManageAccountDialogProps } from '@/constants/dialogs';

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

// TODO(turnkey): Localization
export const ManageAccountDialog = ({ setIsOpen }: DialogProps<ManageAccountDialogProps>) => {
  const [page, setPage] = useState<AccountManagementPage>('default');
  const turnkeyWalletInfo = useAppSelector(selectTurnkeyWalletInfo);

  const emailSection = turnkeyWalletInfo?.userEmail && (
    <ManagementSection
      title="Email"
      description="This email was used to generate your on-chain wallet. You will need access for account recovery."
    >
      <div tw="row rounded-[0.75rem] bg-color-layer-2 px-1 py-0.75">
        <Icon iconName={IconName.EmailStroke} tw="mr-0.75 size-1.25 text-color-text-0" />
        {turnkeyWalletInfo.userEmail}
      </div>
    </ManagementSection>
  );

  const exportSection = (
    <ManagementSection
      title="Export"
      description="Your Turnkey seed phrase is used for your deposits & withdrawals. Your dYdX seed phrase secures your perpetuals account on dYdX chain. Make sure to keep both safe and secure."
    >
      <div tw="flexColumn gap-1">
        <button
          type="button"
          tw="row gap-0.25 rounded-[0.75rem] bg-color-layer-2 px-1 py-0.75"
          onClick={() => setPage('turnkeyExport')}
        >
          Reveal Turnkey Phrase
          <PrivateTag tw="rounded-[360px] px-0.5 font-tiny-bold">Private</PrivateTag>
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
          Reveal dYdX Phrase
          <PrivateTag tw="rounded-[360px] px-0.5 font-tiny-bold">Private</PrivateTag>
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
    default: 'Account Management',
    dydxExport: 'Reveal Secret Phrase',
    turnkeyExport: 'Reveal SecretPhrase',
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
