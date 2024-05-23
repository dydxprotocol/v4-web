import { useMemo } from 'react';

import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { AbacusMarginMode, Subaccount, type SubaccountPosition } from '@/constants/abacus';
import { NUM_PARENT_SUBACCOUNTS } from '@/constants/account';
import { ButtonShape } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { TableCell } from '@/components/Table/TableCell';

import { openDialog } from '@/state/dialogs';

import { getPositionMargin } from '@/lib/tradeData';

type PositionsMarginCellProps = {
  position: SubaccountPosition;
  subaccount: Subaccount | undefined;
};

export const PositionsMarginCell = ({ position, subaccount }: PositionsMarginCellProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useDispatch();

  const { marginMode, marginModeLabel, margin } = useMemo(() => {
    const { childSubaccountNumber } = position;
    const marginMode =
      childSubaccountNumber && childSubaccountNumber >= NUM_PARENT_SUBACCOUNTS
        ? AbacusMarginMode.isolated
        : AbacusMarginMode.cross;

    const marginModeLabel =
      marginMode === AbacusMarginMode.cross
        ? stringGetter({ key: STRING_KEYS.CROSS })
        : stringGetter({ key: STRING_KEYS.ISOLATED });

    const margin = getPositionMargin({ position, subaccount });

    return {
      marginMode,
      marginModeLabel,
      margin,
    };
  }, [position]);

  return (
    <TableCell
      stacked
      slotRight={
        marginMode === AbacusMarginMode.isolated && (
          <$EditButton
            key="edit-margin"
            iconName={IconName.Pencil}
            shape={ButtonShape.Square}
            onClick={() =>
              dispatch(
                openDialog({
                  type: DialogTypes.AdjustIsolatedMargin,
                  dialogProps: { positionId: position.id },
                })
              )
            }
          />
        )
      }
    >
      <Output type={OutputType.Fiat} value={margin} showSign={ShowSign.None} />
      <span>{marginModeLabel}</span>
    </TableCell>
  );
};
const $EditButton = styled(IconButton)`
  --button-icon-size: 1.5em;
  --button-padding: 0;
  --button-textColor: var(--color-text-0);
  --button-hover-textColor: var(--color-text-1);

  margin-left: 0.5rem;
`;
