import styled from 'styled-components';

import { type SubaccountPosition } from '@/constants/abacus';
import { ButtonShape } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { TableCell } from '@/components/Table/TableCell';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { calculatePositionMargin } from '@/lib/tradeData';

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
  const dispatch = useAppDispatch();
  const margin = calculatePositionMargin({
    notionalTotal: notionalTotal?.current,
    adjustedMmf: adjustedMmf?.current,
  });
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
        <$EditButton
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
const $EditButton = styled(IconButton)`
  --button-icon-size: 1.5em;
  --button-padding: 0;
  --button-textColor: var(--color-text-0);
  --button-hover-textColor: var(--color-text-1);

  margin-left: 0.5rem;
`;
