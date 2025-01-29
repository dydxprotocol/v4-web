import { BonsaiHelpers } from '@/bonsai/ontology';
import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { AbacusMarginMode, MARGIN_MODE_STRINGS, TradeInputField } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';

import { Icon, IconName } from '@/components/Icon';
import { ToggleGroup } from '@/components/ToggleGroup';
import { WithTooltip } from '@/components/WithTooltip';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { useAppSelector } from '@/state/appTypes';
import { getInputTradeMarginMode, useTradeFormData } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';

export const MarginModeSelector = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();

  const currentAssetId = useAppSelector(BonsaiHelpers.currentMarket.assetId);
  const canAccountTrade = useAppSelector(calculateCanAccountTrade);

  const marginMode =
    useAppSelector(getInputTradeMarginMode, shallowEqual) ?? AbacusMarginMode.Cross;
  const { needsMarginMode } = useTradeFormData();

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

  const showMarginModeUnToggleableTooltip = canAccountTrade && !needsMarginMode;

  const selector = (
    <$MarginModeSelector tw="flex flex-1 items-center justify-between">
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
            label: showMarginModeUnToggleableTooltip ? (
              stringGetter({
                key: MARGIN_MODE_STRINGS[AbacusMarginMode.Cross.rawValue]!,
              })
            ) : (
              <WithTooltip
                side="left"
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
            label: showMarginModeUnToggleableTooltip ? (
              stringGetter({
                key: MARGIN_MODE_STRINGS[AbacusMarginMode.Isolated.rawValue]!,
              })
            ) : (
              <WithTooltip
                align="end"
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
    </$MarginModeSelector>
  );

  return showMarginModeUnToggleableTooltip ? (
    <$WarningTooltip className={className} slotTooltip={warningTooltip}>
      {selector}
    </$WarningTooltip>
  ) : (
    selector
  );
};

const $MarginModeSelector = styled.div`
  font: var(--font-mini-book);
  @media ${breakpoints.tablet} {
    font: var(--font-small-book);
  }
`;

const $WarningTooltip = styled(WithTooltip)`
  --tooltip-backgroundColor: var(--color-gradient-warning);
  border: 1px solid ${({ theme }) => theme.warning}30;
  gap: 0.5rem;
`;

const $ToggleGroup = styled(ToggleGroup)`
  --separator-padding: 1rem;
  flex-basis: 100%;
  max-width: max-content;
`;
