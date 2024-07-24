import React from 'react';

import { useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';
import { AppRoute } from '@/constants/routes';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { BackButton } from '@/components/BackButton';
import { Output, OutputType } from '@/components/Output';
import { VerticalSeparator } from '@/components/Separator';
import { Tag, TagSize, TagType } from '@/components/Tag';

import { useAppSelector } from '@/state/appTypes';
import { getUserVault, getVaultDetails } from '@/state/vaultSelectors';

import { getNumberSign } from '@/lib/numbers';

import { VaultPositionsTable } from './VaultPositionsTable';

const EmptyValue = () => <$EmptyValue>—</$EmptyValue>;
const $EmptyValue = styled.span`
  color: var(--color-text-0);
`;

export const YourVaultDetailsCards = ({ className }: { className?: string }) => {
  const myVaultMetadata = useAppSelector(getUserVault);
  const stringGetter = useStringGetter();
  const items = [
    {
      key: 'balance',
      label: stringGetter({ key: STRING_KEYS.YOUR_VAULT_BALANCE }),
      value:
        myVaultMetadata == null || myVaultMetadata.userBalance === 0 ? (
          <EmptyValue />
        ) : (
          <Output value={myVaultMetadata?.userBalance} type={OutputType.Fiat} />
        ),
    },
    {
      key: 'pnl',
      label: stringGetter({ key: STRING_KEYS.YOUR_ALL_TIME_PNL }),
      value:
        myVaultMetadata == null || myVaultMetadata?.userReturn.absolute === 0 ? (
          <EmptyValue />
        ) : (
          <$ColoredReturn $sign={getNumberSign(myVaultMetadata?.userReturn.absolute)}>
            <$OutputRow>
              <Output
                value={myVaultMetadata?.userReturn.absolute}
                type={OutputType.Fiat}
                fractionDigits={0}
              />
              <Output
                value={myVaultMetadata?.userReturn.percent}
                type={OutputType.Percent}
                withParentheses
              />
            </$OutputRow>
          </$ColoredReturn>
        ),
    },
  ];
  return (
    <$CardsContainer className={className}>
      {items.map((item) => (
        <$DetailCard key={item.key}>
          <$CardHeader>{item.label}</$CardHeader>
          <$CardValue>{item.value}</$CardValue>
        </$DetailCard>
      ))}
    </$CardsContainer>
  );
};

const $CardsContainer = styled.div`
  ${layoutMixins.gridEqualColumns}
  flex-direction: row;
  gap: 1rem;
`;
const $DetailCard = styled.div`
  border: solid var(--border-width) var(--border-color);
  border-radius: 0.7rem;
  padding: 0.5rem 1rem;
  font: var(--font-base-book);

  ${layoutMixins.column};
`;
const $CardHeader = styled.div`
  color: var(--color-text-0);
`;
const $OutputRow = styled.div`
  ${layoutMixins.row}
  gap: .5rem;
`;
const $CardValue = styled.div`
  font: var(--font-medium-book);
  color: var(--color-text-2);
  line-height: 1.2rem;
`;

export const VaultDescription = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  return (
    <$DescriptionContainer className={className}>
      {stringGetter({ key: STRING_KEYS.VAULT_DESCRIPTION })}
    </$DescriptionContainer>
  );
};
const $DescriptionContainer = styled.div`
  font: var(--font-small-medium);
  color: var(--color-text-0);
`;

export const VaultPositionsSection = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const numPositions = useAppSelector(getVaultDetails)?.positions?.length ?? 0;

  return (
    <div className={className}>
      <$SectionTitle>
        {stringGetter({ key: STRING_KEYS.OPEN_POSITIONS })}{' '}
        <Tag size={TagSize.Medium} type={TagType.Number}>
          {numPositions}
        </Tag>
      </$SectionTitle>
      <VaultPositionsTable />
    </div>
  );
};

const $SectionTitle = styled.div`
  font: var(--font-large-medium);
  color: var(--color-text-2);
  margin-bottom: 1rem;
  ${layoutMixins.row}
  gap: 0.5rem;
`;

export const VaultHeader = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();
  const navigate = useNavigate();

  const { thirtyDayReturnPercent, totalValue } = useAppSelector(getVaultDetails) ?? {};

  const detailItems = [
    {
      key: '30d-apr',
      label: stringGetter({ key: STRING_KEYS.VAULT_THIRTY_DAY_APR }),
      value: (
        <$ColoredReturn $sign={getNumberSign(thirtyDayReturnPercent)}>
          <Output value={thirtyDayReturnPercent} type={OutputType.Percent} />
        </$ColoredReturn>
      ),
    },
    {
      key: 'balance',
      label: stringGetter({ key: STRING_KEYS.TVL }),
      value: <Output value={totalValue} type={OutputType.Fiat} fractionDigits={0} />,
    },
  ];

  return (
    <$HeaderRow className={className}>
      {isTablet && (
        <$BackContainer>
          <BackButton onClick={() => navigate(AppRoute.Portfolio)} />
        </$BackContainer>
      )}
      <$MarketTitle>
        <$VaultImg src="/dydx-chain.png" />
        <div>
          <$MarketTitleText>{stringGetter({ key: STRING_KEYS.VAULT })}</$MarketTitleText>
        </div>
      </$MarketTitle>
      <$DetailItems>
        {detailItems.map((item) => (
          <React.Fragment key={item.key}>
            <$VerticalSeparator />
            <$DetailItem key={item.key}>
              <$DetailLabel>{item.label}</$DetailLabel>
              <$DetailValue>{item.value}</$DetailValue>
            </$DetailItem>
          </React.Fragment>
        ))}
      </$DetailItems>
    </$HeaderRow>
  );
};

const $DetailItems = styled.div`
  display: flex;
  gap: 1.5rem;
  @media (${breakpoints.tablet}) {
    gap: 0.75rem;
  }
`;
const $BackContainer = styled.div`
  display: flex;
  align-items: center;
`;

const $ColoredReturn = styled.div<{ $sign: NumberSign }>`
  display: flex;
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

const $HeaderRow = styled.div`
  ${layoutMixins.flexWrap}
  gap: 1.5rem;
  @media (${breakpoints.tablet}) {
    gap: 0.75rem;
  }
`;

const $MarketTitleText = styled.h3`
  font: var(--font-extra-medium);
  color: var(--color-text-2);
`;

const $MarketTitle = styled.div`
  ${layoutMixins.row}
  gap: 1.25rem;
`;

const $VaultImg = styled.img`
  width: 3.5rem;
  height: 3.5rem;
`;

const $VerticalSeparator = styled(VerticalSeparator)`
  &&& {
    height: 2rem;
  }
`;

const $DetailItem = styled.div`
  ${layoutMixins.flexColumn}
  font: var(--font-base-book);
  padding: 0.25rem 0.5rem;
  gap: 0.375rem;
`;

const $DetailLabel = styled.div`
  color: var(--color-text-0);
`;

const $DetailValue = styled.div`
  font: var(--font-extra-book);
  font-size: 1.563rem; // we need an in-beween for large and extra
  display: flex;
`;
