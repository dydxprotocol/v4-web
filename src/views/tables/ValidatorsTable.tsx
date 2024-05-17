import { useMemo } from 'react';

import styled, { type AnyStyledComponent } from 'styled-components';

import { useValidatorsData } from '@/hooks/useValidatorsData';

import { layoutMixins } from '@/styles/layoutMixins';
import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { Output, OutputType } from '@/components/Output';
import { Table, TableCell } from '@/components/Table';
import { Toolbar } from '@/components/Toolbar';

export const ValidatorsTable = () => {
  const { validatorsData } = useValidatorsData();

  const columns = useMemo(
    () => [
      {
        columnKey: 'validator',
        label: 'Validator',
        getCellValue: (row) => row.description.moniker,
        renderCell: (row) => (
          <TableCell>
            <img src={`${row.description.website}/favicon.ico`} alt="" /> {row.description.moniker}
          </TableCell>
        ),
      },
      {
        columnKey: 'votingPower',
        label: 'Voting Power',
        getCellValue: (row) => row.tokens,
        renderCell: (row) => (
          <Styled.NumberOutput
            type={OutputType.CompactNumber}
            value={parseFloat(row.tokens) / 1e18}
            slotRight=" DYDX"
          />
          /*
          <TableCell>
            {Intl.NumberFormat('en-US', {
              notation: 'compact',
              maximumSignificantDigits: 2,
            }).format(parseFloat(row.tokens) / 1e18)}{' '}
            DYDX
          </TableCell>
          */
        ),
      },
      {
        columnKey: 'commission',
        label: 'Commission',
        getCellValue: (row) => row.commission.commissionRates.rate,
        renderCell: (row) => (
          <Styled.NumberOutput
            type={OutputType.Percent}
            value={parseFloat(row.commission.commissionRates.rate) / 1e18}
          />
        ),
      },
    ],
    [validatorsData?.validators]
  );

  return (
    <>
      <Styled.Toolbar>All Validators</Styled.Toolbar>
      <Styled.Table
        withInnerBorders
        withOuterBorder
        getRowKey={(row) => row.operatorAddress}
        columns={columns}
        data={validatorsData?.validators ?? []}
      />
    </>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Toolbar = styled(Toolbar)`
  max-width: 100vw;
  border: 1px solid var(--border-color);
  border-radius: 0.875rem 0.875rem 0 0;
  background-color: var(--color-layer-3);
  padding-top: 0.875rem;
  padding-bottom: 0.875rem;
`;

Styled.Table = styled(Table)`
  ${tradeViewMixins.horizontalTable}
  --bordered-content-border-radius: 0rem;
  width: calc(100% - 2px);
  margin-left: 1px;
`;

Styled.ValidatorCell = styled(TableCell)`
  flex-direction: 'column';
`;

Styled.InlineRow = styled.div`
  ${layoutMixins.inlineRow}
`;

Styled.SubText = styled.p``;
Styled.NumberOutput = styled(Output)`
  font: var(--font-base-medium);
  color: var(--color-text-2);
`;
