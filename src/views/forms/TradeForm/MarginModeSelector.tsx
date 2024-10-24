import { useCallback } from 'react';

import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { AbacusMarginMode, MARGIN_MODE_STRINGS, TradeInputField } from '@/constants/abacus';
import { DialogTypes, TradeBoxDialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { ToggleGroup } from '@/components/ToggleGroup';
import { WithTooltip } from '@/components/WithTooltip';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog, openDialogInTradeBox } from '@/state/dialogs';
import { getInputTradeMarginMode, useTradeFormData } from '@/state/inputsSelectors';
import { getCurrentMarketAssetId } from '@/state/perpetualsSelectors';

import abacusStateManager from '@/lib/abacus';
import { testFlags } from '@/lib/testFlags';

export const MarginModeSelector = ({
  className,
  openInTradeBox,
}: {
  className?: string;
  openInTradeBox: boolean;
}) => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const currentAssetId = useAppSelector(getCurrentMarketAssetId);
  const canAccountTrade = useAppSelector(calculateCanAccountTrade);

  const marginMode =
    useAppSelector(getInputTradeMarginMode, shallowEqual) ?? AbacusMarginMode.Cross;
  const { needsMarginMode } = useTradeFormData();

  const { uiRefresh } = testFlags;

  const handleClick = useCallback(() => {
    dispatch(
      openInTradeBox
        ? openDialogInTradeBox(TradeBoxDialogTypes.SelectMarginMode())
        : openDialog(DialogTypes.SelectMarginMode())
    );
  }, [dispatch, openInTradeBox]);

  const setMarginMode = (value: string) => {
    abacusStateManager.setTradeValue({
      value,
      field: TradeInputField.marginMode,
    });
  };

  const warningTooltip = (
    <div tw="flex flex-row [align-items:start]">
      <Icon iconName={IconName.Warning} tw="text-[1.5rem] text-color-warning" />
      {stringGetter({
        key: STRING_KEYS.UNABLE_TO_CHANGE_MARGIN_MODE,
        params: {
          MARKET: currentAssetId,
        },
      })}
    </div>
  );

  if (uiRefresh) {
    const selector = (
      <div tw="flex flex-1 items-center justify-between font-mini-regular">
        {stringGetter({
          key: STRING_KEYS.MARGIN_MODE,
        })}
        <$ToggleGroup
          disabled={!canAccountTrade || !needsMarginMode}
          withSeparators
          truncateLabel={false}
          items={[
            {
              value: AbacusMarginMode.Cross.rawValue,
              label: (
                <WithTooltip
                  tooltipString={stringGetter({ key: STRING_KEYS.CROSS_MARGIN_DESCRIPTION })}
                >
                  {stringGetter({
                    key: MARGIN_MODE_STRINGS[AbacusMarginMode.Cross.rawValue]!,
                  })}
                </WithTooltip>
              ),
              disabled: !needsMarginMode && marginMode !== AbacusMarginMode.Cross,
            },
            {
              value: AbacusMarginMode.Isolated.rawValue,
              label: (
                <WithTooltip
                  tooltipString={stringGetter({ key: STRING_KEYS.ISOLATED_MARGIN_DESCRIPTION })}
                >
                  {stringGetter({
                    key: MARGIN_MODE_STRINGS[AbacusMarginMode.Isolated.rawValue]!,
                  })}
                </WithTooltip>
              ),
              disabled: !needsMarginMode && marginMode !== AbacusMarginMode.Isolated,
            },
          ]}
          value={marginMode.rawValue}
          onValueChange={setMarginMode}
        />
      </div>
    );

    return canAccountTrade && !needsMarginMode ? (
      <$WarningTooltip className={className} slotTooltip={warningTooltip}>
        {selector}
      </$WarningTooltip>
    ) : (
      selector
    );
  }

  return needsMarginMode ? (
    <Button onClick={handleClick} className={className} disabled={!canAccountTrade}>
      <$Text>
        {stringGetter({
          key: MARGIN_MODE_STRINGS[marginMode.rawValue]!,
        })}
      </$Text>
      <Icon iconName={IconName.Triangle} tw="ml-[0.5ch] rotate-[0.75turn] text-[0.4375rem]" />
    </Button>
  ) : (
    <$WarningTooltip className={className} slotTooltip={warningTooltip}>
      <Button disabled>
        <$Text>
          {stringGetter({
            key: MARGIN_MODE_STRINGS[marginMode.rawValue]!,
          })}
        </$Text>
      </Button>
    </$WarningTooltip>
  );
};

const $WarningTooltip = styled(WithTooltip)`
  --tooltip-backgroundColor: var(--color-gradient-warning);
  border: 1px solid ${({ theme }) => theme.warning}30;
  gap: 0.5rem;
`;

const $Text = styled.div`
  ${layoutMixins.textTruncate};
`;

const $ToggleGroup = styled(ToggleGroup)`
  --separator-padding: 1rem;
  flex-basis: 100%;
  max-width: max-content;
`;
