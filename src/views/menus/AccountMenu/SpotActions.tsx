import { memo } from 'react';

import { Item } from '@radix-ui/react-dropdown-menu';
import styled, { css } from 'styled-components';

import { ButtonAction, ButtonShape } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { WithTooltip } from '@/components/WithTooltip';
import { useMaxWithdrawableSol } from '@/views/dialogs/TransferDialogs/WithdrawDialog2/withdrawSpotHooks';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { isTruthy } from '@/lib/isTruthy';

export const SpotActions = memo(() => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const maxWithdrawable = useMaxWithdrawableSol();
  const hasBalance = maxWithdrawable > 0;

  return (
    <div tw="inlineRow">
      {[
        {
          dialog: DialogTypes.Deposit2({}),
          iconName: IconName.Deposit,
          tooltipStringKey: STRING_KEYS.DEPOSIT,
        },
        hasBalance && {
          dialog: DialogTypes.Withdraw2({}),
          iconName: IconName.Withdraw,
          tooltipStringKey: STRING_KEYS.WITHDRAW,
        },
      ]
        .filter(isTruthy)
        .map(({ iconName, tooltipStringKey, dialog }) => (
          <Item key={tooltipStringKey}>
            <WithTooltip
              key={tooltipStringKey}
              tooltipString={stringGetter({ key: tooltipStringKey })}
              tw="[--tooltip-backgroundColor:--color-layer-5]"
            >
              <$IconButton
                key={dialog.type}
                action={ButtonAction.Base}
                shape={ButtonShape.Square}
                iconName={iconName}
                onClick={() => dispatch(openDialog(dialog))}
              />
            </WithTooltip>
          </Item>
        ))}
    </div>
  );
});

const $IconButton = styled(IconButton)`
  --button-padding: 0 0.25rem;
  --button-border: solid var(--border-width) var(--color-layer-6);

  ${({ iconName }) =>
    iconName != null &&
    [IconName.Withdraw, IconName.Deposit].includes(iconName) &&
    css`
      --button-icon-size: 1.375em;
    `}
`;
