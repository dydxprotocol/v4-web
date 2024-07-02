import { ReactNode } from 'react';

import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { Output, OutputType } from '@/components/Output';
import { PortfolioCard } from '@/components/PortfolioCard';

import { useAppSelector } from '@/state/appTypes';
import { getAllVaultsWithUserBalance } from '@/state/vaultSelectors';

import { testFlags } from '@/lib/testFlags';

type MaybeVaultPositionsPanelProps = {
  onViewVault: (marketId: string) => void;
  className?: string;
  header: ReactNode;
};

type UserVault = ReturnType<typeof getAllVaultsWithUserBalance>[number];

export const MaybeVaultPositionsPanel = ({
  onViewVault,
  header,
  className,
}: MaybeVaultPositionsPanelProps) => {
  const userVaults = useAppSelector(getAllVaultsWithUserBalance);
  const { isTablet } = useBreakpoints();
  if (!testFlags.enableVaults) return null;
  if (!userVaults.length && !isTablet) {
    return null;
  }

  return (
    <div className={className}>
      {header}
      <VaultPositionsCards onViewVault={onViewVault} userVaults={userVaults} />
    </div>
  );
};

type VaultPositionsCardsProps = {
  onViewVault: (marketId: string) => void;
  userVaults: UserVault[];
};

const VaultPositionsCards = ({ onViewVault, userVaults }: VaultPositionsCardsProps) => {
  const stringGetter = useStringGetter();
  if (userVaults.length === 0) {
    return <$Empty>{stringGetter({ key: STRING_KEYS.YOU_HAVE_NO_VAULT_DEPOSITS })}</$Empty>;
  }
  return (
    <$Cards>
      {userVaults.map((vault) => (
        <VaultPositionCard
          key={vault.marketId}
          marketId={vault.marketId}
          vault={vault}
          onViewVault={onViewVault}
        />
      ))}
    </$Cards>
  );
};

type VaultPositionCardProps = {
  marketId: string;
  onViewVault: (marketId: string) => void;
  vault: UserVault;
};

export const VaultPositionCard = ({ marketId, onViewVault, vault }: VaultPositionCardProps) => {
  const stringGetter = useStringGetter();
  const { asset, userInfo } = vault;

  return (
    <PortfolioCard
      assetName={asset?.name ?? ''}
      assetId={asset?.id ?? ''}
      detailLabel={stringGetter({ key: STRING_KEYS.YOUR_LP_VAULT_BALANCE })}
      detailValue={<Output type={OutputType.Fiat} value={userInfo?.userBalance} />}
      actionSlot={
        <$Link onClick={() => onViewVault(marketId)} isAccent>
          {stringGetter({ key: STRING_KEYS.VIEW_VAULT })} <Icon iconName={IconName.Arrow} />
        </$Link>
      }
    />
  );
};

const $Link = styled(Link)`
  font: var(--font-small-book);
`;

const $Cards = styled.div`
  ${layoutMixins.flexWrap}
  gap: 1rem;
  scroll-snap-align: none;
`;

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
