import { shallowEqual } from 'react-redux';
import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';

import { ButtonAction, ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { NumberSign } from '@/constants/numbers';
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
import { Tag } from '@/components/Tag';

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
  const { allTimePnl, currentLeverageMultiple, thirtyDayReturnPercent, currentPosition } =
    useAppSelector(getCurrentMarketVaultDetails) ?? {};
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
      value: (
        <$ColoredReturn
          $sign={
            allTimePnl?.absolute == null || allTimePnl?.absolute === 0
              ? NumberSign.Neutral
              : allTimePnl.absolute > 0
                ? NumberSign.Positive
                : NumberSign.Negative
          }
        >
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
      label: '30d APR',
      value: <Output value={thirtyDayReturnPercent} type={OutputType.Percent} />,
    },
    {
      key: 'vault-position',
      label: 'Vault Position',
      value: (
        <$PositionContainer>
          <$ColoredReturn
            $sign={
              currentPosition?.asset == null || currentPosition?.asset === 0
                ? NumberSign.Neutral
                : currentPosition?.asset > 0
                  ? NumberSign.Positive
                  : NumberSign.Negative
            }
          >
            <Output
              value={currentPosition?.asset}
              type={OutputType.CompactNumber}
              showSign={ShowSign.Both}
            />
          </$ColoredReturn>
          <Tag>{id}</Tag>
          <$MutedText>
            <Output value={currentPosition?.usdc} type={OutputType.Fiat} withParentheses />
          </$MutedText>
        </$PositionContainer>
      ),
    },
    {
      key: 'vault-leverage',
      label: 'Vault Leverage',
      value: <Output value={currentLeverageMultiple} type={OutputType.Multiple} />,
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
            <Button
              type={ButtonType.Button}
              shape={ButtonShape.Pill}
              size={ButtonSize.Small}
              slotRight={<Icon iconName={IconName.LinkOut} />}
            >
              Vault Details
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
              Vault FAQs
            </Button>
          )}
        </$Buttons>
      </$Header>

      <$Header>
        <$DepositWithdrawButtons>
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
        </$DepositWithdrawButtons>
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
  font: var(--font-mini-book);
`;
