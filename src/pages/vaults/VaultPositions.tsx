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
import { getVaultAccount } from '@/state/vaultSelectors';

import { testFlags } from '@/lib/testFlags';

type MaybeVaultPositionsPanelProps = {
  onViewVault: () => void;
  className?: string;
  header: ReactNode;
};

type UserVault = ReturnType<typeof getVaultAccount>;

export const MaybeVaultPositionsPanel = ({
  onViewVault,
  header,
  className,
}: MaybeVaultPositionsPanelProps) => {
  const userVault = useAppSelector(getVaultAccount);
  const { isTablet } = useBreakpoints();
  if (!testFlags.enableVaults) return null;
  if (userVault == null && !isTablet) {
    return null;
  }

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
  const stringGetter = useStringGetter();
  if (userVault == null) {
    return <$Empty>{stringGetter({ key: STRING_KEYS.YOU_HAVE_NO_VAULT_DEPOSITS })}</$Empty>;
  }
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
      assetName={stringGetter({ key: STRING_KEYS.VAULT })}
      assetIcon={<img src="/dydx-chain.png" tw="h-1.5 w-1.5" />}
      detailLabel={stringGetter({ key: STRING_KEYS.YOUR_VAULT_BALANCE })}
      detailValue={<Output type={OutputType.Fiat} value={vault?.balanceUsdc} />}
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
