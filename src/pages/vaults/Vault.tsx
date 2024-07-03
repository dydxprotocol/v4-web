import { useEffect } from 'react';

import { Link, useMatch, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';

import { useAppSelector } from '@/state/appTypes';
import { getAssets } from '@/state/assetsSelectors';
import { getPerpetualMarkets } from '@/state/perpetualsSelectors';

import { orEmptyObj } from '@/lib/typeUtils';

import { FullVaultInfo } from './FullVaultInfo';

const useCurrentVaultId = () => {
  const navigate = useNavigate();
  const match = useMatch(`${AppRoute.Vaults}/:vaultId`);
  const { vaultId } = match?.params ?? {};
  useEffect(() => {
    if (vaultId == null) {
      navigate(AppRoute.Vaults);
    }
  }, [navigate, vaultId]);
  return vaultId ?? '';
};

const Vault = () => {
  const stringGetter = useStringGetter();
  const vaultId = useCurrentVaultId();

  const { assetId } = orEmptyObj(useAppSelector(getPerpetualMarkets)?.[vaultId ?? '']);
  const asset = useAppSelector(getAssets)?.[assetId ?? ''];

  useDocumentTitle(
    stringGetter({ key: STRING_KEYS.ASSET_VAULT, params: { ASSET: asset?.name ?? '' } })
  );

  return (
    <$Page>
      <$Container>
        <$NavHeader>
          <$OverviewLink to={`${AppRoute.Vaults}`}>
            {stringGetter({ key: STRING_KEYS.VAULTS_OVERVIEW })}
          </$OverviewLink>
          <$CaretIcon iconName={IconName.ChevronRight} />
          <$AssetName>{asset?.id ?? ''}</$AssetName>
        </$NavHeader>

        <$TwoColumnContainer>
          <$VaultDetailsColumn>
            <FullVaultInfo vaultId={vaultId} />
          </$VaultDetailsColumn>
          <$VaultDepositWithdrawFormColumn>
            <$PlaceholderBox />
          </$VaultDepositWithdrawFormColumn>
        </$TwoColumnContainer>
      </$Container>
    </$Page>
  );
};

const $Page = styled.div`
  ${layoutMixins.contentContainerPage}
`;
const $Container = styled.div`
  padding: 1rem;
`;
const $NavHeader = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`;
const $OverviewLink = styled(Link)`
  --link-color: var(--color-text-0);
`;
const $CaretIcon = styled(Icon)`
  color: var(--color-text-0);
  margin-top: 0.1rem;
`;
const $AssetName = styled.span``;

const $TwoColumnContainer = styled.div`
  ${layoutMixins.contentSectionDetached}
  ${layoutMixins.flexEqualColumns}
  flex-wrap: wrap;
  gap: 2.5rem;
`;
const $VaultDetailsColumn = styled.div`
  min-width: 30rem;
`;
const $VaultDepositWithdrawFormColumn = styled.div`
  max-width: min-content;
`;
const $PlaceholderBox = styled.div`
  width: 25rem;
  height: 22rem;
  border-radius: 0.7rem;
  background-color: var(--color-layer-3);
`;

export default Vault;
