import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { HorizontalSeparatorFiller } from '@/components/Separator';
import { YourVaultDetailsCards, useVaultDetailsItems } from '@/views/VaultDetails';

import { useAppSelector } from '@/state/appTypes';
import { getAssets } from '@/state/assetsSelectors';
import { getPerpetualMarkets } from '@/state/perpetualsSelectors';

import { orEmptyObj } from '@/lib/typeUtils';

type FullVaultInfoProps = {
  vaultId: string;
};

export const FullVaultInfo = ({ vaultId }: FullVaultInfoProps) => {
  const stringGetter = useStringGetter();
  const { configs, assetId } = orEmptyObj(useAppSelector(getPerpetualMarkets)?.[vaultId ?? '']);
  const asset = useAppSelector(getAssets)?.[assetId ?? ''];

  const detailItems = useVaultDetailsItems(vaultId);
  return (
    <$Container>
      <$HeaderRow>
        <$MarketTitle>
          <AssetIcon symbol={assetId} />
          {stringGetter({ key: STRING_KEYS.ASSET_VAULT, params: { ASSET: asset?.name ?? '' } })}
        </$MarketTitle>
        <$YourVaultDetailsCards vaultId={vaultId} />
      </$HeaderRow>
      <$DetailsRow>
        {detailItems
          .filter((i) => i.key !== 'balance')
          .map((item) => (
            <$DetailItem key={item.key}>
              <$DetailLabel>{item.label}</$DetailLabel>
              <$DetailValue>{item.value}</$DetailValue>
            </$DetailItem>
          ))}
      </$DetailsRow>
      <$HorizontalSeparatorFiller />
      <$PnlRow></$PnlRow>
      <$HorizontalSeparatorFiller />
      <$HistoryRow>
        <$SectionTitle>{stringGetter({ key: STRING_KEYS.DEPOSITS_AND_WITHDRAWALS })}</$SectionTitle>
      </$HistoryRow>
    </$Container>
  );
};

const $Container = styled.div`
  ${layoutMixins.flexColumn}
  gap: 1.25rem;
`;
const $HeaderRow = styled.div`
  ${layoutMixins.flexEqualRow}
  justify-content: space-between;
`;
const $MarketTitle = styled.h3`
  ${layoutMixins.row}
  font: var(--font-large-medium);
  gap: 1.25rem;

  img {
    width: 2.25rem;
    height: 2.25rem;
  }
`;
const $YourVaultDetailsCards = styled(YourVaultDetailsCards)`
  min-width: min-content;
`;

const $HorizontalSeparatorFiller = styled(HorizontalSeparatorFiller)`
  display: flex;
  min-height: 1px;
`;

const $DetailsRow = styled.div`
  ${layoutMixins.flexWrap}
  gap: 2rem;
`;
const $DetailItem = styled.div`
  ${layoutMixins.flexColumn}
  font: var(--font-small-book);
  padding: 0 0.5rem;
`;
const $DetailLabel = styled.div`
  color: var(--color-text-0);
`;
const $DetailValue = styled.div``;

const $PnlRow = styled.div``;
const $HistoryRow = styled.div``;

const $SectionTitle = styled.div`
  font: var(--font-large-medium);
  margin-bottom: 1rem;
`;

type VaultTransactionsTableProps = { vaultId: string; className?: string };

export const VaultTransactionsTable = ({ vaultId, className }: VaultTransactionsTableProps) => {
  return <div>FullVaultInfo</div>;
};

const $Empty = styled.div`
  ${layoutMixins.column}

  justify-items: center;
  align-content: center;
  padding: 3rem;

  border: solid var(--border-width) var(--border-color);
  border-radius: 1rem;
  margin: 1rem;
  margin-top: 0;

  color: var(--color-text-0);
  font: var(--font-base-book);
`;
