import { shallowEqual } from 'react-redux';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { ButtonAction, ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketAssetData } from '@/state/assetsSelectors';
import { getCurrentMarketData } from '@/state/perpetualsSelectors';

export const VaultDetails: React.FC = () => {
  const stringGetter = useStringGetter();
  const { market } = useAppSelector(getCurrentMarketData, shallowEqual) ?? {};
  const { id, name } = useAppSelector(getCurrentMarketAssetData, shallowEqual) ?? {};
  const { vaultsLearnMore } = useURLConfigs();

  return (
    <$VaultDetails>
      <$Header>
        <$WrapRow>
          <$MarketTitle>
            <AssetIcon symbol={id} />
            {stringGetter({ key: STRING_KEYS.ASSET_VAULT, params: { ASSET: name } })}
          </$MarketTitle>
        </$WrapRow>

        <$VaultDescription>
          <p>{stringGetter({ key: STRING_KEYS.VAULT_DESCRIPTION })}</p>
        </$VaultDescription>

        <$Buttons>
          <Link to={`${AppRoute.Vaults}/${market}`}>
            <Button
              type={ButtonType.Button}
              shape={ButtonShape.Pill}
              size={ButtonSize.Small}
              slotRight={<Icon iconName={IconName.LinkOut} />}
            >
              {stringGetter({ key: STRING_KEYS.VAULT_DETAILS })}
            </Button>
          </Link>
          {vaultsLearnMore && (
            <Button
              type={ButtonType.Link}
              shape={ButtonShape.Pill}
              size={ButtonSize.Small}
              action={ButtonAction.Navigation}
              href={vaultsLearnMore}
              slotRight={<Icon iconName={IconName.LinkOut} />}
            >
              {stringGetter({ key: STRING_KEYS.VAULT_FAQS })}
            </Button>
          )}
        </$Buttons>
      </$Header>

      <$DetailsContainer>
        <$DepositWithdrawButtons>
          <Button
            type={ButtonType.Button}
            action={ButtonAction.Primary}
            shape={ButtonShape.Rectangle}
            size={ButtonSize.Small}
            slotLeft={<Icon iconName={IconName.Deposit} />}
          >
            {stringGetter({ key: STRING_KEYS.DEPOSIT })}
          </Button>
          <Button
            type={ButtonType.Button}
            shape={ButtonShape.Rectangle}
            size={ButtonSize.Small}
            slotLeft={<Icon iconName={IconName.Withdraw} />}
          >
            {stringGetter({ key: STRING_KEYS.WITHDRAW })}
          </Button>
        </$DepositWithdrawButtons>
      </$DetailsContainer>
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
  --column-max-width: 24rem;
  --single-column-max-width: 25rem;

  padding: clamp(0.5rem, 7.5%, 2.5rem);
  row-gap: 1rem;

  @media ${breakpoints.tablet} {
    padding: 0 clamp(0.5rem, 7.5%, 2.5rem);
  }
`;

const $Header = styled.header`
  ${layoutMixins.column}
  align-content: start;
  gap: 1.25rem;
`;
const $DetailsContainer = styled($Header)`
  gap: 0.25rem;
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
const $DepositWithdrawButtons = styled($Buttons)`
  justify-content: end;
`;
