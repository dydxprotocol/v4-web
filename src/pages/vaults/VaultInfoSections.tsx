import React from 'react';

import BigNumber from 'bignumber.js';
import { useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';
import { AppRoute } from '@/constants/routes';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useEnvConfig } from '@/hooks/useEnvConfig';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';
import {
  useLoadedVaultAccount,
  useLoadedVaultDetails,
  useLoadedVaultPositions,
} from '@/hooks/vaultsHooks';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { BackButton } from '@/components/BackButton';
import { Link } from '@/components/Link';
import { Output, OutputType } from '@/components/Output';
import { VerticalSeparator } from '@/components/Separator';
import { Tag, TagSize, TagType } from '@/components/Tag';
import { WithTooltip } from '@/components/WithTooltip';
import { MegaVaultYieldOutput } from '@/views/MegaVaultYieldOutput';

import { getNumberSign } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

import { VaultPositionsTable } from './VaultPositionsTable';

const EmptyValue = () => <span tw="text-color-text-0">—</span>;
export const YourVaultDetailsCards = ({ className }: { className?: string }) => {
  const myVaultMetadata = useLoadedVaultAccount().data;
  const stringGetter = useStringGetter();
  const items = [
    {
      key: 'balance',
      label: stringGetter({ key: STRING_KEYS.YOUR_VAULT_BALANCE }),
      tooltip: 'vault-your-balance' as const,
      value:
        myVaultMetadata == null || myVaultMetadata.balanceUsdc === 0 ? (
          <EmptyValue />
        ) : (
          <Output
            value={myVaultMetadata.balanceUsdc}
            roundingMode={BigNumber.ROUND_FLOOR}
            type={OutputType.Fiat}
          />
        ),
    },
    {
      key: 'pnl',
      label: stringGetter({ key: STRING_KEYS.YOUR_ALL_TIME_PNL }),
      tooltip: 'vault-all-time-pnl' as const,
      value:
        myVaultMetadata == null ||
        myVaultMetadata.allTimeReturnUsdc == null ||
        myVaultMetadata.allTimeReturnUsdc === 0 ? (
          <EmptyValue />
        ) : (
          <$ColoredReturn $sign={getNumberSign(myVaultMetadata.allTimeReturnUsdc, 0.01)}>
            <div tw="row gap-0.5">
              <Output value={myVaultMetadata.allTimeReturnUsdc} type={OutputType.Fiat} />
            </div>
          </$ColoredReturn>
        ),
    },
  ];
  return (
    <$CardsContainer className={className}>
      {items.map((item) => (
        <$DetailCard key={item.key}>
          <WithTooltip tooltip={item.tooltip}>
            <div tw="text-color-text-0">{item.label}</div>
          </WithTooltip>
          <div tw="leading-[1.2rem] text-color-text-2 font-medium-book">{item.value}</div>
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

  ${layoutMixins.column}
`;
export const VaultDescription = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const { vaultOperatorLearnMore, vaultLearnMore } = useURLConfigs();
  const operatorName = useEnvConfig('megavaultOperatorName');
  return (
    <div className={className} tw="flex flex-col gap-0.5 text-color-text-0 font-small-medium">
      <p>
        {stringGetter({
          key: STRING_KEYS.VAULT_DESCRIPTION,
        })}{' '}
        {vaultLearnMore && (
          <Link isInline withIcon href={vaultLearnMore}>
            {stringGetter({ key: STRING_KEYS.LEARN_MORE_ABOUT_MEGAVAULT })}
          </Link>
        )}
      </p>
      {operatorName.length > 0 && (
        <p>
          {stringGetter({
            key: STRING_KEYS.VAULT_OPERATOR_DESCRIPTION,
            params: {
              OPERATOR_NAME: operatorName,
            },
          })}{' '}
          {vaultOperatorLearnMore && (
            <Link isInline withIcon href={vaultOperatorLearnMore}>
              {stringGetter({
                key: STRING_KEYS.LEARN_MORE_ABOUT_OPERATOR,
                params: {
                  OPERATOR_NAME: operatorName,
                },
              })}
            </Link>
          )}
        </p>
      )}
    </div>
  );
};
export const VaultPositionsSection = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const numPositions = useLoadedVaultPositions()?.positions?.length;
  const { vaultMetrics } = useURLConfigs();

  return (
    <div className={className}>
      <div tw="row mb-1 justify-between">
        <div tw="row gap-0.5 text-color-text-2 font-large-medium">
          {stringGetter({ key: STRING_KEYS.HOLDINGS })}{' '}
          <Tag size={TagSize.Medium} type={TagType.Number}>
            {numPositions}
          </Tag>
        </div>
        {vaultMetrics && (
          <Link isInline withIcon href={vaultMetrics}>
            {stringGetter({ key: STRING_KEYS.METRICS })}
          </Link>
        )}
      </div>
      <VaultPositionsTable />
    </div>
  );
};
export const VaultHeader = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();
  const navigate = useNavigate();

  const { totalValue } = orEmptyObj(useLoadedVaultDetails().data);

  const detailItems = [
    {
      key: '30d-apr',
      label: stringGetter({ key: STRING_KEYS.EST_APR_PLAIN }),
      tooltip: 'vault-apr' as const,
      value: <MegaVaultYieldOutput />,
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
        <div tw="flex items-center">
          <BackButton onClick={() => navigate(AppRoute.Portfolio)} />
        </div>
      )}
      <div tw="row gap-1.25">
        <img src="/dydx-chain.png" tw="h-3.5 w-3.5" />
        <div>
          <h3 tw="text-color-text-2 font-extra-medium">
            {stringGetter({ key: STRING_KEYS.MEGAVAULT })}
          </h3>
        </div>
      </div>
      <$DetailItems>
        {detailItems.map((item) => (
          <React.Fragment key={item.key}>
            <$VerticalSeparator />
            <div key={item.key} tw="flexColumn gap-0.375 px-0.5 py-0.25 font-base-book">
              <WithTooltip tooltip={item.tooltip} side="bottom">
                <div tw="text-color-text-0">{item.label}</div>
              </WithTooltip>
              <$DetailValue>{item.value}</$DetailValue>
            </div>
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
const $VerticalSeparator = styled(VerticalSeparator)`
  &&& {
    height: 2rem;
  }
`;
const $DetailValue = styled.div`
  font: var(--font-extra-book);
  font-size: 1.563rem; // we need an in-beween for large and extra
  display: flex;
`;
