import { useState } from 'react';

import { MarginMode, TradeFormSummary } from '@/bonsai/forms/trade/types';
import { BonsaiHelpers } from '@/bonsai/ontology';
import styled from 'styled-components';

import { ButtonAction, ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { ComplianceStates } from '@/constants/compliance';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { MobilePlaceOrderSteps } from '@/constants/trade';
import { IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { useComplianceState } from '@/hooks/useComplianceState';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { DetailsItem } from '@/components/Details';
import { DiffOutput } from '@/components/DiffOutput';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { WithSeparators } from '@/components/Separator';
import { ToggleButton } from '@/components/ToggleButton';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { WithTooltip } from '@/components/WithTooltip';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { getSubaccountId } from '@/state/accountInfoSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';
import { getTradeFormValues } from '@/state/tradeFormSelectors';

import { getDisplayableAssetFromBaseAsset } from '@/lib/assetUtils';
import { isTruthy } from '@/lib/isTruthy';
import { nullIfZero } from '@/lib/numbers';
import { calculateCrossPositionMargin, getDoubleValuesHasDiff } from '@/lib/tradeData';
import { orEmptyObj } from '@/lib/typeUtils';

type ConfirmButtonConfig = {
  stringKey: string;
  buttonTextStringKey: string;
  buttonAction: ButtonAction;
};

type ElementProps = {
  actionStringKey?: string;
  confirmButtonConfig: ConfirmButtonConfig;
  currentStep?: MobilePlaceOrderSteps;
  hasInput: boolean;
  hasValidationErrors?: boolean;
  onClearInputs: () => void;
  shouldEnableTrade: boolean;
  showDeposit?: boolean;
  summary: TradeFormSummary;
  tradingUnavailable: boolean;
};

export const PlaceOrderButtonAndReceipt = ({
  actionStringKey,
  confirmButtonConfig,
  currentStep,
  hasInput,
  hasValidationErrors,
  onClearInputs,
  shouldEnableTrade,
  showDeposit,
  summary,
  tradingUnavailable,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();
  const { chainTokenImage, chainTokenLabel } = useTokenConfigs();
  const { complianceState } = useComplianceState();

  const canAccountTrade = useAppSelector(calculateCanAccountTrade);
  const subaccountNumber = useAppSelector(getSubaccountId);

  const id = useAppSelector(BonsaiHelpers.currentMarket.assetId);
  const { tickSizeDecimals } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)
  );
  const {
    liquidationPrice,
    leverage,
    notional: notionalTotal,
    adjustedImf,
    marginValueMaintenance,
  } = orEmptyObj(summary.accountDetailsBefore?.position);

  const postOrderPositionData = orEmptyObj(summary.accountDetailsAfter?.position);

  const tradeValues = useAppSelector(getTradeFormValues);
  const { marginMode } = tradeValues;

  const [isReceiptOpen, setIsReceiptOpen] = useState(true);

  const hasMissingData = subaccountNumber === undefined;

  const { tradeInfo, tradePayload } = summary;
  const { fee, inputSummary, reward } = orEmptyObj(tradeInfo);
  const expectedPrice = inputSummary?.averageFillPrice;

  // approximation for whether inputs are filled by whether summary has been calculated
  const areInputsFilled = tradePayload != null;

  const renderMarginValue = () => {
    if (marginMode === MarginMode.CROSS) {
      const currentCrossMargin = nullIfZero(
        calculateCrossPositionMargin({
          notionalTotal: notionalTotal?.toNumber(),
          adjustedImf: adjustedImf?.toNumber(),
        })
      );

      const postOrderCrossMargin = nullIfZero(
        calculateCrossPositionMargin({
          notionalTotal: postOrderPositionData.notional?.toNumber(),
          adjustedImf: postOrderPositionData.adjustedImf?.toNumber(),
        })
      );

      return (
        <DiffOutput
          useGrouping
          type={OutputType.Fiat}
          value={currentCrossMargin}
          newValue={postOrderCrossMargin}
          withDiff={areInputsFilled && currentCrossMargin !== postOrderCrossMargin}
        />
      );
    }

    return (
      <DiffOutput
        useGrouping
        type={OutputType.Fiat}
        value={marginValueMaintenance}
        newValue={postOrderPositionData.marginValueMaintenance}
        withDiff={
          areInputsFilled &&
          getDoubleValuesHasDiff(
            marginValueMaintenance?.toNumber(),
            postOrderPositionData.marginValueMaintenance?.toNumber() ??
              (summary.tradeInfo.isPositionClosed ? 0 : undefined)
          )
        }
      />
    );
  };

  const items = (
    [
      {
        key: 'expected-price',
        label: (
          <WithTooltip tooltip="expected-price" side="right">
            {stringGetter({ key: STRING_KEYS.EXPECTED_PRICE })}
          </WithTooltip>
        ),
        value: (
          <Output
            useGrouping
            fractionDigits={tickSizeDecimals}
            type={OutputType.Fiat}
            value={expectedPrice}
          />
        ),
      },
      {
        key: 'liquidation-price',
        label: (
          <WithTooltip
            tooltip={
              postOrderPositionData.side === IndexerPositionSide.SHORT
                ? 'liquidation-price-short'
                : 'liquidation-price-long'
            }
            stringParams={{ SYMBOL: getDisplayableAssetFromBaseAsset(id) }}
            side="right"
          >
            {stringGetter({ key: STRING_KEYS.LIQUIDATION_PRICE })}
          </WithTooltip>
        ),
        value: (
          <DiffOutput
            useGrouping
            type={OutputType.Fiat}
            fractionDigits={tickSizeDecimals}
            value={liquidationPrice}
            newValue={postOrderPositionData.liquidationPrice}
            withDiff={
              areInputsFilled &&
              getDoubleValuesHasDiff(
                liquidationPrice?.toNumber(),
                postOrderPositionData.liquidationPrice?.toNumber() ??
                  (summary.tradeInfo.isPositionClosed ? 0 : undefined)
              )
            }
          />
        ),
      },
      {
        key: 'position-margin',
        label: (
          <WithTooltip tooltip="position-margin" side="right">
            {stringGetter({ key: STRING_KEYS.POSITION_MARGIN })}
          </WithTooltip>
        ),
        value: renderMarginValue(),
      },
      {
        key: 'position-leverage',
        label: (
          <WithTooltip tooltip="position-leverage" side="right">
            {stringGetter({ key: STRING_KEYS.POSITION_LEVERAGE })}
          </WithTooltip>
        ),
        value: (
          <DiffOutput
            useGrouping
            type={OutputType.Multiple}
            value={leverage?.toNumber()}
            newValue={postOrderPositionData.leverage}
            withDiff={
              areInputsFilled &&
              getDoubleValuesHasDiff(
                leverage?.toNumber(),
                postOrderPositionData.leverage?.toNumber() ??
                  (summary.tradeInfo.isPositionClosed ? 0 : undefined)
              )
            }
            showSign={ShowSign.None}
          />
        ),
      },
      {
        key: 'fee',
        label: (
          <WithTooltip tooltip="fee" side="right">
            {stringGetter({ key: STRING_KEYS.FEE })}
          </WithTooltip>
        ),
        value: <Output type={OutputType.Fiat} value={fee} useGrouping />,
      },
      {
        key: 'max-reward',
        label: (
          <>
            {stringGetter({ key: STRING_KEYS.MAXIMUM_REWARDS })}
            <AssetIcon logoUrl={chainTokenImage} symbol={chainTokenLabel} />
          </>
        ),
        value: (
          <Output
            type={OutputType.Asset}
            value={reward}
            useGrouping
            tag={reward ? chainTokenLabel : ''}
          />
        ),
        tooltip: 'max-reward',
      },
    ] satisfies Array<DetailsItem | false | undefined>
  ).filter(isTruthy);

  const returnToMarketState = () => ({
    buttonTextStringKey: STRING_KEYS.RETURN_TO_MARKET,
    buttonAction: ButtonAction.Secondary,
    buttonState: {},
    showValidatorError: false,
  });

  const buttonStatesPerStep = {
    [MobilePlaceOrderSteps.EditOrder]: {
      buttonTextStringKey: shouldEnableTrade
        ? STRING_KEYS.PREVIEW_ORDER
        : actionStringKey ?? STRING_KEYS.UNAVAILABLE,
      buttonAction: ButtonAction.Primary,
      buttonState: { isDisabled: !shouldEnableTrade, isLoading: hasMissingData },
      showValidatorError: true,
    },

    [MobilePlaceOrderSteps.PreviewOrder]: {
      buttonTextStringKey: STRING_KEYS.CONFIRM_ORDER,
      buttonAction: confirmButtonConfig.buttonAction,
      buttonState: {},
      showValidatorError: false,
    },
    [MobilePlaceOrderSteps.PlacingOrder]: returnToMarketState(),
    [MobilePlaceOrderSteps.PlaceOrderFailed]: returnToMarketState(),
    [MobilePlaceOrderSteps.Confirmation]: returnToMarketState(),
  };

  const buttonAction = currentStep
    ? buttonStatesPerStep[currentStep].buttonAction
    : confirmButtonConfig.buttonAction;

  let buttonTextStringKey = STRING_KEYS.UNAVAILABLE;
  if (tradingUnavailable) {
    buttonTextStringKey = STRING_KEYS.UNAVAILABLE;
  } else if (currentStep) {
    buttonTextStringKey = buttonStatesPerStep[currentStep].buttonTextStringKey;
  } else if (shouldEnableTrade) {
    buttonTextStringKey = confirmButtonConfig.buttonTextStringKey;
  } else if (actionStringKey) {
    buttonTextStringKey = actionStringKey;
  }

  const buttonState = currentStep
    ? buttonStatesPerStep[currentStep].buttonState
    : {
        isDisabled: !shouldEnableTrade,
        isLoading: hasMissingData,
      };

  const depositButton = (
    <Button
      action={ButtonAction.Primary}
      onClick={() => dispatch(openDialog(DialogTypes.Deposit2({})))}
    >
      {stringGetter({ key: STRING_KEYS.DEPOSIT_FUNDS })}
    </Button>
  );

  const showValidatorErrors =
    hasValidationErrors && (!currentStep || buttonStatesPerStep[currentStep].showValidatorError);

  const submitButton = (
    <Button
      state={buttonState}
      type={ButtonType.Submit}
      action={buttonAction}
      slotLeft={
        showValidatorErrors && areInputsFilled ? (
          <Icon iconName={IconName.Warning} tw="text-color-warning" />
        ) : undefined
      }
      tw="w-full"
    >
      {stringGetter({
        key: buttonTextStringKey,
        params: {
          ORDER: stringGetter({
            key: confirmButtonConfig.stringKey,
          }),
        },
      })}
    </Button>
  );

  return (
    <$Footer>
      <div tw="row gap-0.5 justify-self-end px-0 py-0.5">
        <$WithSeparators layout="row">
          {[
            hasInput && (
              <Button
                type={ButtonType.Reset}
                action={ButtonAction.Reset}
                shape={ButtonShape.Pill}
                size={ButtonSize.XSmall}
                onClick={onClearInputs}
                key="clear"
              >
                {stringGetter({ key: STRING_KEYS.CLEAR })}
              </Button>
            ),
            <$HideButton
              slotRight={<Icon iconName={IconName.Caret} size="0.66em" />}
              shape={ButtonShape.Pill}
              size={ButtonSize.XSmall}
              onPressedChange={setIsReceiptOpen}
              isPressed={isReceiptOpen}
              key="hide"
            >
              {stringGetter({ key: STRING_KEYS.RECEIPT })}
            </$HideButton>,
          ].filter(isTruthy)}
        </$WithSeparators>
      </div>
      <WithDetailsReceipt detailItems={items} hideReceipt={!isReceiptOpen}>
        {!canAccountTrade ? (
          <OnboardingTriggerButton size={ButtonSize.Base} />
        ) : showDeposit && complianceState === ComplianceStates.FULL_ACCESS ? (
          depositButton
        ) : (
          submitButton
        )}
      </WithDetailsReceipt>
    </$Footer>
  );
};

const $Footer = styled.footer`
  ${formMixins.footer}
  padding-bottom: var(--dialog-content-paddingBottom);

  ${layoutMixins.column}
`;

const $WithSeparators = styled(WithSeparators)`
  --separatorHeight-padding: 0.5rem;
`;

const $HideButton = styled(ToggleButton)`
  --button-toggle-off-backgroundColor: var(--color-layer-3);
  --button-toggle-on-backgroundColor: var(--color-layer-3);
  --button-toggle-on-textColor: var(--button-toggle-off-textColor);
  --button-icon-size: 1em;
  margin-right: 0.5em;
  gap: 0.75ch;

  &[data-state='off'] {
    svg {
      rotate: -0.5turn;
    }
  }
`;
