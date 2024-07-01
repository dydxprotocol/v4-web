import { shallowEqual } from 'react-redux';
import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';

import { ButtonAction, ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign, TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { AppRoute } from '@/constants/routes';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType, ShowSign } from '@/components/Output';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketAssetData } from '@/state/assetsSelectors';
import { getCurrentMarketData } from '@/state/perpetualsSelectors';
import {
  getCurrentMarketVaultDetails,
  getCurrentMarketVaultMetadata,
} from '@/state/vaultSelectors';

import { getNumberSign } from '@/lib/numbers';

export const VaultDetails: React.FC = () => {
  const stringGetter = useStringGetter();
  const { market, configs } = useAppSelector(getCurrentMarketData, shallowEqual) ?? {};
  const { id, name } = useAppSelector(getCurrentMarketAssetData, shallowEqual) ?? {};
  const { allTimePnl, currentLeverageMultiple, thirtyDayReturnPercent, currentPosition } =
    useAppSelector(getCurrentMarketVaultDetails) ?? {};
  const { totalValue } = useAppSelector(getCurrentMarketVaultMetadata) ?? {};
  const { vaultsLearnMore } = useURLConfigs();

  const items = [
    {
      key: 'balance',
      label: stringGetter({ key: STRING_KEYS.VAULT_BALANCE }),
      value: <Output value={totalValue} type={OutputType.CompactFiat} />,
    },
    {
      key: 'all-time-pnl',
      label: stringGetter({ key: STRING_KEYS.VAULT_ALL_TIME_PNL }),
      value: (
        <$ColoredReturn $sign={getNumberSign(allTimePnl?.absolute)}>
          {allTimePnl?.absolute != null ? (
            <Output value={allTimePnl?.absolute} type={OutputType.CompactFiat} />
          ) : (
            '-'
          )}{' '}
          <Output value={allTimePnl?.percent} type={OutputType.Percent} withParentheses />
        </$ColoredReturn>
      ),
    },
    {
      key: '30d-apr',
      label: stringGetter({ key: STRING_KEYS.VAULT_THIRTY_DAY_APR }),
      value: <Output value={thirtyDayReturnPercent} type={OutputType.Percent} />,
    },
    {
      key: 'vault-position',
      label: stringGetter({ key: STRING_KEYS.VAULT_POSITION }),
      value: (
        <$PositionContainer>
          <$ColoredReturn $sign={getNumberSign(currentPosition?.asset)}>
            <Output
              value={currentPosition?.asset}
              type={OutputType.Asset}
              tag={id}
              showSign={ShowSign.Negative}
              fractionDigits={configs?.stepSizeDecimals ?? TOKEN_DECIMALS}
            />
          </$ColoredReturn>
          <$MutedText>
            <Output
              value={currentPosition?.usdc}
              type={OutputType.Fiat}
              withParentheses
              fractionDigits={USD_DECIMALS}
            />
          </$MutedText>
        </$PositionContainer>
      ),
    },
    {
      key: 'vault-leverage',
      label: stringGetter({ key: STRING_KEYS.VAULT_LEVERAGE }),
      value: <Output value={currentLeverageMultiple} type={OutputType.Multiple} />,
    },
  ];

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
          <Link to={`${AppRoute.Trade}/${market}`}>
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
        <$Details items={items} withSeparators />
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
const $PositionContainer = styled.div`
  display: flex;
  gap: 0.2rem;
`;
const $ColoredReturn = styled.div<{ $sign: NumberSign }>`
  display: flex;
  gap: 0.25rem;
  ${({ $sign }) =>
    $sign &&
    {
      [NumberSign.Positive]: css`
        color: var(--color-positive);
      `,
      [NumberSign.Negative]: css`
        color: var(--color-negative);
      `,
      [NumberSign.Neutral]: null,
    }[$sign]}
`;
const $MutedText = styled.span`
  color: var(--color-text-0);
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
const $Details = styled(Details)`
  font: var(--font-base-book);
  dd {
    font-size: 1rem;
  }
  --details-item-vertical-padding: 1rem;
`;
