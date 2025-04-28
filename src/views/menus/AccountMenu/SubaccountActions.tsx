import { memo } from 'react';

import { Item } from '@radix-ui/react-dropdown-menu';
import type { Dispatch } from '@reduxjs/toolkit';
import styled, { css } from 'styled-components';

import { ButtonAction, ButtonShape } from '@/constants/buttons';
import { ComplianceStates } from '@/constants/compliance';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS, StringGetterFunction } from '@/constants/localization';
import { DydxChainAsset } from '@/constants/wallets';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { WithTooltip } from '@/components/WithTooltip';

import { calculateIsAccountViewOnly } from '@/state/accountCalculators';
import { useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { isTruthy } from '@/lib/isTruthy';

export const SubaccountActions = memo(
  ({
    asset,
    dispatch,
    complianceState,
    withOnboarding,
    hasBalance,
    stringGetter,
  }: {
    asset: DydxChainAsset;
    dispatch: Dispatch;
    complianceState: ComplianceStates;
    withOnboarding?: boolean;
    hasBalance?: boolean;
    stringGetter: StringGetterFunction;
  }) => {
    const isAccountViewOnly = useAppSelector(calculateIsAccountViewOnly);

    return (
      <div tw="inlineRow">
        {[
          withOnboarding &&
            complianceState === ComplianceStates.FULL_ACCESS &&
            !isAccountViewOnly && {
              dialog: DialogTypes.Deposit2({}),
              iconName: IconName.Deposit,
              tooltipStringKey: STRING_KEYS.DEPOSIT,
            },
          withOnboarding &&
            hasBalance &&
            !isAccountViewOnly && {
              dialog: DialogTypes.Withdraw2({}),
              iconName: IconName.Withdraw,
              tooltipStringKey: STRING_KEYS.WITHDRAW,
            },
          hasBalance &&
            complianceState === ComplianceStates.FULL_ACCESS &&
            !isAccountViewOnly && {
              dialog: DialogTypes.Transfer({ selectedAsset: asset }),
              iconName: IconName.Send,
              tooltipStringKey: STRING_KEYS.TRANSFER,
            },
        ]
          .filter(isTruthy)
          .map(({ iconName, tooltipStringKey, dialog }) => (
            <Item key={tooltipStringKey}>
              {/* Need to wrap in Item to enable 'dismiss dropdown on click' functionality
        In general, any CTA in a dropdown should be wrapped in an Item tag
     */}
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
  }
);

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
