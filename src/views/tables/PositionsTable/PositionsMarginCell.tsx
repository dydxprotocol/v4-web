import { SubaccountPosition } from '@/bonsai/types/summaryTypes';
import styled from 'styled-components';

import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { TableCell } from '@/components/Table/TableCell';
import { WithTooltip } from '@/components/WithTooltip';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

type PositionsMarginCellProps = {
  position: SubaccountPosition;
};

export const PositionsMarginCell = ({ position }: PositionsMarginCellProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  return (
    <TableCell
      slotRight={
        position.marginMode === 'ISOLATED' && (
          <WithTooltip tooltipString={stringGetter({ key: STRING_KEYS.ADJUST_ISOLATED_MARGIN })}>
            <$EditButton
              key="edit-margin"
              iconName={IconName.Pencil}
              shape={ButtonShape.Square}
              size={ButtonSize.XSmall}
              onClick={() =>
                // todo this handoff should be using uniqueid
                dispatch(
                  openDialog(DialogTypes.AdjustIsolatedMargin({ positionId: position.uniqueId }))
                )
              }
            />
          </WithTooltip>
        )
      }
    >
      <Output type={OutputType.Fiat} value={position.marginValueInitial} showSign={ShowSign.None} />
    </TableCell>
  );
};

const $EditButton = styled(IconButton)`
  --button-textColor: var(--color-text-0);
  --button-hover-textColor: var(--color-text-1);
  --button-backgroundColor: transparent;
  --button-border: none;
  --button-width: min-content;
`;
