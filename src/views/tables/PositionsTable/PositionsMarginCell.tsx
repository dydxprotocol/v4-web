import { useMemo } from 'react';

import styled from 'styled-components';

import { AbacusMarginMode, type SubaccountPosition } from '@/constants/abacus';
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

import { testFlags } from '@/lib/testFlags';
import { getMarginModeFromSubaccountNumber, getPositionMargin } from '@/lib/tradeData';

type PositionsMarginCellProps = {
  position: SubaccountPosition;
};

export const PositionsMarginCell = ({ position }: PositionsMarginCellProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  const { uiRefresh } = testFlags;

  const { marginMode, marginModeLabel, margin } = useMemo(() => {
    const { childSubaccountNumber } = position;
    const derivedMarginMode = getMarginModeFromSubaccountNumber(childSubaccountNumber);

    return {
      marginMode: derivedMarginMode,
      marginModeLabel:
        derivedMarginMode === AbacusMarginMode.Cross
          ? stringGetter({ key: STRING_KEYS.CROSS })
          : stringGetter({ key: STRING_KEYS.ISOLATED }),
      margin: getPositionMargin({ position }),
    };
  }, [position, stringGetter]);

  return uiRefresh ? (
    <TableCell
      slotRight={
        marginMode === AbacusMarginMode.Isolated && (
          <WithTooltip tooltipString={stringGetter({ key: STRING_KEYS.ADJUST_ISOLATED_MARGIN })}>
            <$EditButton
              key="edit-margin"
              iconName={IconName.Pencil}
              shape={ButtonShape.Square}
              size={ButtonSize.XSmall}
              onClick={() =>
                dispatch(openDialog(DialogTypes.AdjustIsolatedMargin({ positionId: position.id })))
              }
            />
          </WithTooltip>
        )
      }
    >
      <Output type={OutputType.Fiat} value={margin} showSign={ShowSign.None} />
    </TableCell>
  ) : (
    <TableCell
      stacked
      slotRight={
        marginMode === AbacusMarginMode.Isolated && (
          <WithTooltip tooltipString={stringGetter({ key: STRING_KEYS.ADJUST_ISOLATED_MARGIN })}>
            <$EditButtonDeprecated
              key="edit-margin"
              iconName={IconName.Pencil}
              shape={ButtonShape.Square}
              onClick={() =>
                dispatch(openDialog(DialogTypes.AdjustIsolatedMargin({ positionId: position.id })))
              }
            />
          </WithTooltip>
        )
      }
    >
      <Output type={OutputType.Fiat} value={margin} showSign={ShowSign.None} />
      <span>{marginModeLabel}</span>
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

const $EditButtonDeprecated = styled(IconButton)`
  --button-icon-size: 1.5em;
  --button-padding: 0;
  --button-textColor: var(--color-text-0);
  --button-hover-textColor: var(--color-text-1);

  margin-left: 0.5rem;
`;
