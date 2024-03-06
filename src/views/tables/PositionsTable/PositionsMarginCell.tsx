import styled, { AnyStyledComponent } from 'styled-components';

import { type SubaccountPosition } from '@/constants/abacus';
import { ButtonShape } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { TableCell } from '@/components/Table/TableCell';

import { MustBigNumber } from '@/lib/numbers';

type PositionsMarginCellProps = {
  isDisabled?: boolean;
  notionalTotal: SubaccountPosition['notionalTotal'];
  adjustedMmf: SubaccountPosition['adjustedMmf'];
};

export const PositionsMarginCell = ({
  adjustedMmf,
  isDisabled,
  notionalTotal,
}: PositionsMarginCellProps) => {
  const stringGetter = useStringGetter();
  const notionalTotalBN = MustBigNumber(notionalTotal?.current);
  const adjustedMmfBN = MustBigNumber(adjustedMmf?.current);
  const margin = notionalTotalBN.times(adjustedMmfBN);

  const marginModeLabel = true
    ? stringGetter({ key: STRING_KEYS.CROSS })
    : stringGetter({ key: STRING_KEYS.ISOLATED });

  return (
    <TableCell
      stacked
      slotRight={
        <Styled.EditButton
          key="edit-margin"
          iconName={IconName.Pencil}
          shape={ButtonShape.Square}
          isDisabled={isDisabled}
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
