import styled from 'styled-components';
import tw from 'twin.macro';

import { DialogTypes } from '@/constants/dialogs';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { DetachedSection } from '@/components/ContentSection';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';
import { AuthorizedAccountsTable } from '@/views/tables/AuthorizedAccountsTable';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

const PermissionedKeysPage = () => {
  useDocumentTitle('Permissioned Accounts');
  const dispatch = useAppDispatch();

  const onAddAccount = () => {
    dispatch(openDialog(DialogTypes.AddPermissionedAccount({})));
  };

  return (
    <$Page>
      <ContentSectionHeader
        title="Permissioned Accounts"
        slotRight={<Button onClick={onAddAccount}>Add Account</Button>}
      />

      <$DetachedSection>
        <AuthorizedAccountsTable />
      </$DetachedSection>
    </$Page>
  );
};

const $Page = styled.div`
  ${layoutMixins.contentContainerPage}
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
`;

const $DetachedSection = tw(DetachedSection)`flex flex-col gap-1.5 p-1 max-w-7xl tablet:w-screen`;

export default PermissionedKeysPage;
