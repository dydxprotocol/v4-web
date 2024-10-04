import { ReactNode } from 'react';

import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useLoadedVaultAccount } from '@/hooks/vaultsHooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { Output, OutputType } from '@/components/Output';
import { PortfolioCard } from '@/components/PortfolioCard';

import { testFlags } from '@/lib/testFlags';

type MaybeVaultPositionsPanelProps = {
  onViewVault: () => void;
  className?: string;
  header: ReactNode;
};

type UserVault = ReturnType<typeof useLoadedVaultAccount>['data'];

export const MaybeVaultPositionsPanel = ({
  onViewVault,
  header,
  className,
}: MaybeVaultPositionsPanelProps) => {
  const userVault = useLoadedVaultAccount().data;
  if (!testFlags.enableVaults) return null;

  return (
    <div className={className}>
      {header}
      <VaultPositionsCards onViewVault={onViewVault} userVault={userVault} />
    </div>
  );
};

type VaultPositionsCardsProps = {
  onViewVault: () => void;
  userVault: UserVault;
};

const VaultPositionsCards = ({ onViewVault, userVault }: VaultPositionsCardsProps) => {
  return (
    <$Cards>
      <VaultPositionCard vault={userVault} onViewVault={onViewVault} />
    </$Cards>
  );
};

type VaultPositionCardProps = {
  onViewVault: () => void;
  vault: UserVault;
};

export const VaultPositionCard = ({ onViewVault, vault }: VaultPositionCardProps) => {
  const stringGetter = useStringGetter();

  return (
    <PortfolioCard
      assetName={stringGetter({ key: STRING_KEYS.MEGAVAULT })}
      assetIcon={<img src="/dydx-chain.png" tw="h-1.5 w-1.5" />}
      detailLabel={stringGetter({ key: STRING_KEYS.YOUR_VAULT_BALANCE })}
      detailValue={<Output tw="flex" type={OutputType.Fiat} value={vault?.balanceUsdc ?? 0} />}
      actionSlot={
        <Link onClick={onViewVault} isAccent tw="font-small-book">
          {stringGetter({ key: STRING_KEYS.VIEW_VAULT })} <Icon iconName={IconName.Arrow} />
        </Link>
      }
    />
  );
};
const $Cards = styled.div`
  ${layoutMixins.flexWrap}
  gap: 1rem;
  scroll-snap-align: none;
`;
