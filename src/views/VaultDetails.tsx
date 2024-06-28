import { shallowEqual } from 'react-redux';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { ButtonAction, ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { AppRoute } from '@/constants/routes';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketAssetData } from '@/state/assetsSelectors';
import { getCurrentMarketData } from '@/state/perpetualsSelectors';
import {
  getCurrentMarketVaultDetails,
  getCurrentMarketVaultMetadata,
} from '@/state/vaultSelectors';

export const VaultDetails: React.FC = () => {
  const stringGetter = useStringGetter();
  const { market } = useAppSelector(getCurrentMarketData, shallowEqual) ?? {};
  const { id, name } = useAppSelector(getCurrentMarketAssetData, shallowEqual) ?? {};
  const {} = useAppSelector(getCurrentMarketVaultDetails) ?? {};
  const { totalValue } = useAppSelector(getCurrentMarketVaultMetadata) ?? {};
  const { vaultsLearnMore } = useURLConfigs();

  const items = [
    {
      key: 'balance',
      label: 'Vault Balance',
      value: <Output value={totalValue} type={OutputType.CompactFiat} />,
    },
    {
      key: 'all-time-pnl',
      label: 'All-time Vault P&L',
      value: market,
    },
    {
      key: '30d-apr',
      label: '30d APR',
      value: market,
    },
    {
      key: 'vault-position',
      label: 'Vault Position',
      value: market,
    },
    {
      key: 'vault-leverage',
      label: 'Vault Leverage',
      value: market,
    },
  ];

  return (
    <$VaultDetails>
      <$Header>
        <$WrapRow>
          <$MarketTitle>
            <AssetIcon symbol={id} />
            {name} Vault
          </$MarketTitle>
        </$WrapRow>

        <$VaultDescription>
          {/* Todo - stringGetter */}
          <p>
            Vaults provide automated liquidity on all dYdX markets. Vaults aim for a market-neutral
            position by quoting both sides of the book. P&L will vary based on market conditions and
            there&apos;s a risk of losing some or all of the USDC deposited.
          </p>
        </$VaultDescription>

        <$Buttons>
          <Link to={`${AppRoute.Trade}/${market}`}>
            <Button type={ButtonType.Button} shape={ButtonShape.Pill} size={ButtonSize.Small}>
              Vault Details
            </Button>
          </Link>
          {vaultsLearnMore && (
            <Button
              type={ButtonType.Link}
              shape={ButtonShape.Pill}
              size={ButtonSize.Small}
              href={vaultsLearnMore}
              slotRight={<Icon iconName={IconName.LinkOut} />}
            >
              Vault FAQs
            </Button>
          )}
        </$Buttons>
      </$Header>

      <$Header>
        <$Buttons>
          <Button
            type={ButtonType.Button}
            action={ButtonAction.Primary}
            shape={ButtonShape.Rectangle}
            size={ButtonSize.Small}
            slotLeft={<Icon iconName={IconName.Deposit} />}
          >
            Deposit
          </Button>
          <Button
            type={ButtonType.Button}
            shape={ButtonShape.Rectangle}
            size={ButtonSize.Small}
            slotLeft={<Icon iconName={IconName.Withdraw} />}
          >
            Withdraw
          </Button>
        </$Buttons>
        <$Details items={items} withSeparators />
      </$Header>
    </$VaultDetails>
  );
};

const $VaultDetails = styled.div`
  margin: auto;
  width: 100%;

  ${layoutMixins.gridConstrainedColumns}
  --grid-max-columns: 2;
  --column-gap: 2.25em;
  --column-min-width: 18rem;
  --column-max-width: 22rem;
  --single-column-max-width: 25rem;

  justify-content: center;
  align-items: center;
  padding: clamp(0.5rem, 7.5%, 2.5rem);
  row-gap: 1rem;

  @media ${breakpoints.tablet} {
    padding: 0 clamp(0.5rem, 7.5%, 2.5rem);
  }
`;
const $Header = styled.header`
  ${layoutMixins.column}
  gap: 1.25rem;
`;
const $WrapRow = styled.div`
  ${layoutMixins.row}
  gap: 0.5rem;

  flex-wrap: wrap;
`;
const $MarketTitle = styled.h3`
  ${layoutMixins.row}
  font: var(--font-large-medium);
  gap: 0.5rem;

  img {
    width: 2.25rem;
    height: 2.25rem;
  }
`;
const $VaultDescription = styled.div`
  ${layoutMixins.column}
  gap: 0.5em;

  p {
    font: var(--font-small-book);

    &:last-of-type {
      color: var(--color-text-0);
    }
  }
`;
const $Buttons = styled.div`
  ${layoutMixins.row}
  flex-wrap: wrap;
  gap: 0.5rem;

  overflow-x: auto;
`;
const $Details = styled(Details)`
  font: var(--font-mini-book);
`;
