import styled, { AnyStyledComponent } from 'styled-components';

import { ButtonShape } from '@/constants/buttons';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { ActionsTableCell } from '@/components/Table';

import { testFlags } from '@/lib/testFlags';

type ElementProps = {
  isDisabled?: boolean;
};

export const PositionsActionsCell = ({ isDisabled }: ElementProps) => {
  const onTriggersButtonClick = () => {};
  const onCloseButtonClick = () => {};

  return (
    <ActionsTableCell
      children={[
        testFlags.configureSlTpFromPositionsTable && (
          <Styled.TriggersButton
            key="edittriggers"
            onClick={onTriggersButtonClick}
            iconName={IconName.Pencil}
            shape={ButtonShape.Square}
            isDisabled={isDisabled}
          />
        ),
        testFlags.closePositionsFromPositionsTable && (
          <Styled.CloseButton
            key="closepositions"
            onClick={onCloseButtonClick}
            iconName={IconName.Close}
            shape={ButtonShape.Square}
            isDisabled={isDisabled}
          />
        ),
      ]}
    />
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.TriggersButton = styled(IconButton)`
  svg {
    width: 1.5em;
    height: 1.5em;
  }
`;

Styled.CloseButton = styled(IconButton)`
  --button-hover-textColor: var(--color-red);

  svg {
    width: 0.875em;
    height: 0.875em;
  }
`;
