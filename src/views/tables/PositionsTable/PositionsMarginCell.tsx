import { useDispatch } from 'react-redux';
import styled, { AnyStyledComponent } from 'styled-components';

import { type SubaccountPosition } from '@/constants/abacus';
import { ButtonShape } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { TableCell } from '@/components/Table/TableCell';

import { openDialog } from '@/state/dialogs';

import { MustBigNumber } from '@/lib/numbers';

type PositionsMarginCellProps = {
  id: SubaccountPosition['id'];
  notionalTotal: SubaccountPosition['notionalTotal'];
  adjustedMmf: SubaccountPosition['adjustedMmf'];
};

export const PositionsMarginCell = ({
  id,
  adjustedMmf,
  notionalTotal,
}: PositionsMarginCellProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useDispatch();
  const notionalTotalBN = MustBigNumber(notionalTotal?.current);
  const adjustedMmfBN = MustBigNumber(adjustedMmf?.current);
  const margin = notionalTotalBN.times(adjustedMmfBN);
  const perpetualMarketType = 'CROSS'; // Todo: Replace with perpetualMarketType when available

  const marginModeLabel =
    perpetualMarketType === 'CROSS'
      ? stringGetter({ key: STRING_KEYS.CROSS })
      : stringGetter({ key: STRING_KEYS.ISOLATED });

  return (
    <TableCell
      stacked
      slotRight={
        // perpetualMarketType === 'CROSS' &&
        <Styled.EditButton
          key="edit-margin"
          iconName={IconName.Pencil}
          shape={ButtonShape.Square}
          onClick={() =>
            dispatch(
              openDialog({
                type: DialogTypes.AdjustIsolatedMargin,
                dialogProps: { positionId: id },
              })
            )
          }
        />
      }
    >
      <Output type={OutputType.Fiat} value={margin} showSign={ShowSign.None} />
      <span>{marginModeLabel}</span>
    </TableCell>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.EditButton = styled(IconButton)`
  svg {
    width: 1.5em;
    height: 1.5em;
  }
`;
