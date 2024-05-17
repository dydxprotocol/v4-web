import { useMemo } from 'react';

import styled, { type AnyStyledComponent } from 'styled-components';

import { useValidatorsData } from '@/hooks/useValidatorsData';

import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { Table, TableCell } from '@/components/Table';
import { Toolbar } from '@/components/Toolbar';

export const ValidatorsTable = () => {
  const { validatorsData } = useValidatorsData();

  const columns = useMemo(
    () =>
      console.log(validatorsData?.validators) || [
        {
          columnKey: 'validator',
          label: 'Validator',
          getCellValue: (row) => row.description.moniker,
          renderCell: (row) => (
            <TableCell>
              <img src={`${row.description.website}/favicon.ico`} alt="" />{' '}
              {row.description.moniker}
            </TableCell>
          ),
        },
        {
          columnKey: 'votingPower',
          label: 'Voting Power',
          getCellValue: (row) => row.tokens,
          renderCell: (row) => <TableCell>{parseFloat(row.tokens) / 1e18} DYDX</TableCell>,
        },
        {
          columnKey: 'commission',
          label: 'Commission',
          getCellValue: (row) => row.commission.commissionRates.rate,
          renderCell: (row) => (
            <TableCell>{parseFloat(row.commission.commissionRates.rate) / 1e16}%</TableCell>
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
`;

Styled.ValidatorCell = styled(TableCell)`
  flex-direction: 'column';
`;
