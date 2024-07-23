import { useCallback } from 'react';

import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { MARGIN_MODE_STRINGS } from '@/constants/abacus';
import { DialogTypes, TradeBoxDialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { WithTooltip } from '@/components/WithTooltip';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog, openDialogInTradeBox } from '@/state/dialogs';
import { getInputTradeData, useTradeFormData } from '@/state/inputsSelectors';
import { getCurrentMarketAssetId } from '@/state/perpetualsSelectors';

import { orEmptyObj } from '@/lib/typeUtils';

export const MarginModeSelector = ({
  className,
  openInTradeBox,
}: {
  className?: string;
  openInTradeBox: boolean;
}) => {
  const stringGetter = useStringGetter();
  const currentAssetId = useAppSelector(getCurrentMarketAssetId);
  const { marginMode } = orEmptyObj(useAppSelector(getInputTradeData, shallowEqual));
  const { needsMarginMode } = useTradeFormData();

  const dispatch = useAppDispatch();
  const handleClick = useCallback(() => {
    dispatch(
      openInTradeBox
        ? openDialogInTradeBox(TradeBoxDialogTypes.SelectMarginMode())
        : openDialog(DialogTypes.SelectMarginMode())
    );
  }, [dispatch, openInTradeBox]);

  return needsMarginMode ? (
    <Button onClick={handleClick} className={className}>
      {marginMode &&
        stringGetter({
          key: MARGIN_MODE_STRINGS[marginMode.rawValue],
        })}
      <Icon iconName={IconName.Triangle} tw="ml-[0.5ch] rotate-[0.75turn] text-[0.4375rem]" />
    </Button>
  ) : (
    <$WarningTooltip
      className={className}
      slotTooltip={
        <div tw="flex flex-row [align-items:start]">
          <Icon iconName={IconName.Warning} tw="text-[1.5rem] text-warning" />
          {stringGetter({
            key: STRING_KEYS.UNABLE_TO_CHANGE_MARGIN_MODE,
            params: {
              MARKET: currentAssetId,
            },
          })}
        </div>
      }
    >
      <Button disabled>
        {marginMode &&
          stringGetter({
            key: MARGIN_MODE_STRINGS[marginMode.rawValue],
          })}
      </Button>
    </$WarningTooltip>
  );
};
const $WarningTooltip = styled(WithTooltip)`
  --tooltip-backgroundColor: var(--color-gradient-warning);
  border: 1px solid ${({ theme }) => theme.warning}30;
`;
