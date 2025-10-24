import BigNumber from 'bignumber.js';
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

type ElementProps = {
  marketId: string;
  effectiveSelectedLeverage: BigNumber;
};

export const PositionsLeverageCell = ({ marketId, effectiveSelectedLeverage }: ElementProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  return (
    <TableCell
      slotRight={
        <WithTooltip tooltipString={stringGetter({ key: STRING_KEYS.EDIT_LEVERAGE })}>
          <$EditButton
            key="edit-leverage"
            tw="mt-0.125"
            iconName={IconName.Pencil}
            shape={ButtonShape.Square}
            size={ButtonSize.XSmall}
            onClick={() => dispatch(openDialog(DialogTypes.SetMarketLeverage({ marketId })))}
          />
        </WithTooltip>
      }
    >
      <Output
        type={OutputType.Multiple}
        value={effectiveSelectedLeverage}
        fractionDigits={0}
        showSign={ShowSign.None}
      />
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
