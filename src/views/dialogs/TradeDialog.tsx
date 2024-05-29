import { useState } from 'react';

import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import styled, { css } from 'styled-components';

import { MARGIN_MODE_STRINGS } from '@/constants/abacus';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { LEVERAGE_DECIMALS } from '@/constants/numbers';
import { MobilePlaceOrderSteps } from '@/constants/trade';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Dialog, DialogPlacement } from '@/components/Dialog';
import { GreenCheckCircle } from '@/components/GreenCheckCircle';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { Ring } from '@/components/Ring';
import { WithTooltip } from '@/components/WithTooltip';
import { TradeForm } from '@/views/forms/TradeForm';

import { openDialog } from '@/state/dialogs';
import { getInputTradeData, useTradeFormData } from '@/state/inputsSelectors';
import { getCurrentMarketAssetId } from '@/state/perpetualsSelectors';

import { orEmptyObj } from '@/lib/typeUtils';

import { TradeSideToggle } from '../forms/TradeForm/TradeSideToggle';

type ElementProps = {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  slotTrigger?: React.ReactNode;
};

export const TradeDialog = ({ isOpen, setIsOpen, slotTrigger }: ElementProps) => {
  const { isMobile } = useBreakpoints();
  const dispatch = useDispatch();
  const stringGetter = useStringGetter();
  const currentAssetId = useSelector(getCurrentMarketAssetId);
  const currentTradeData = orEmptyObj(useSelector(getInputTradeData, shallowEqual));
  const { marginMode, targetLeverage } = currentTradeData;

  const { needsMarginMode, needsTargetLeverage } = useTradeFormData();
  const [currentStep, setCurrentStep] = useState<MobilePlaceOrderSteps>(
    MobilePlaceOrderSteps.EditOrder
  );

  const onCloseDialog = () => {
    setCurrentStep(MobilePlaceOrderSteps.EditOrder);
    setIsOpen?.(false);
  };

  const marginModeSelector = needsMarginMode ? (
    <Button
      onClick={() => {
        dispatch(
          openDialog({
            type: DialogTypes.SelectMarginMode,
          })
        );
      }}
    >
      {marginMode &&
        stringGetter({
          key: MARGIN_MODE_STRINGS[marginMode.rawValue],
        })}
      <$TriangleIcon iconName={IconName.Triangle} />
    </Button>
  ) : (
    <$WarningTooltip
      slotTooltip={
        <$WarningTooltipContent>
          <$WarningIcon iconName={IconName.Warning} />
          {stringGetter({
            key: STRING_KEYS.UNABLE_TO_CHANGE_MARGIN_MODE,
            params: {
              MARKET: currentAssetId,
            },
          })}
        </$WarningTooltipContent>
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

  return (
    <$Dialog
      isOpen={isOpen}
      setIsOpen={(open: boolean) => (open ? setIsOpen?.(true) : onCloseDialog())}
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
      currentStep={currentStep}
      slotTrigger={slotTrigger}
      hasHeaderBorder
      {...{
        [MobilePlaceOrderSteps.EditOrder]: {
          title: (
            <$EditTradeHeader>
              {marginModeSelector}

              {needsTargetLeverage && (
                <WithTooltip
                  tooltip="target-leverage"
                  stringParams={{ TARGET_LEVERAGE: targetLeverage?.toFixed(LEVERAGE_DECIMALS) }}
                >
                  <Button
                    onClick={() => {
                      dispatch(openDialog({ type: DialogTypes.AdjustTargetLeverage }));
                    }}
                  >
                    <Output type={OutputType.Multiple} value={targetLeverage} />
                  </Button>
                </WithTooltip>
              )}

              <TradeSideToggle />
            </$EditTradeHeader>
          ),
        },
        [MobilePlaceOrderSteps.PreviewOrder]: {
          title: (
            <$PreviewTitle>{stringGetter({ key: STRING_KEYS.PREVIEW_ORDER_TITLE })}</$PreviewTitle>
          ),
          description: stringGetter({ key: STRING_KEYS.PREVIEW_ORDER_DESCRIPTION }),
        },
        [MobilePlaceOrderSteps.PlacingOrder]: {
          title: stringGetter({ key: STRING_KEYS.PLACING_ORDER_TITLE }),
          description: stringGetter({ key: STRING_KEYS.PLACING_ORDER_DESCRIPTION }),
          slotIcon: <$Ring withAnimation value={0.25} />,
        },
        [MobilePlaceOrderSteps.PlaceOrderFailed]: {
          title: stringGetter({ key: STRING_KEYS.PLACE_ORDER_FAILED }),
          description: stringGetter({ key: STRING_KEYS.PLACE_ORDER_FAILED_DESCRIPTION }),
          slotIcon: <$WarningIcon iconName={IconName.Warning} />,
        },
        [MobilePlaceOrderSteps.Confirmation]: {
          title: stringGetter({ key: STRING_KEYS.CONFIRMED_TITLE }),
          description: stringGetter({ key: STRING_KEYS.CONFIRMED_DESCRIPTION }),
          slotIcon: <$GreenCheckCircle />,
        },
      }[currentStep]}
    >
      <$TradeForm
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        onConfirm={onCloseDialog}
      />
    </$Dialog>
  );
};
const $Dialog = styled(Dialog)<{ currentStep: MobilePlaceOrderSteps }>`
  --dialog-backgroundColor: var(--color-layer-2);
  --dialog-header-height: 1rem;
  --dialog-content-paddingTop: 0;
  --dialog-content-paddingBottom: 0;
  --dialog-content-paddingLeft: 0;
  --dialog-content-paddingRight: 0;
  --dialog-title-gap: 0.25rem;
  --dialog-icon-size: 2rem;

  ${({ currentStep }) =>
    currentStep === MobilePlaceOrderSteps.EditOrder &&
    css`
      --dialog-icon-size: 2.5rem;
    `}
`;

const $EditTradeHeader = styled.div`
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 0.5rem;
`;

const $TradeForm = styled(TradeForm)`
  --tradeBox-content-paddingTop: 1rem;
  --tradeBox-content-paddingRight: 1.5rem;
  --tradeBox-content-paddingBottom: 1.5rem;
  --tradeBox-content-paddingLeft: 1.5rem;
`;

const $TriangleIcon = styled(Icon)`
  font-size: 0.4375rem;
  transform: rotate(0.75turn);
  margin-left: 0.5ch;
`;

const $WarningTooltip = styled(WithTooltip)`
  --tooltip-backgroundColor: var(--color-gradient-warning);
  border: 1px solid ${({ theme }) => theme.warning}30;
`;

const $WarningTooltipContent = styled.div`
  display: flex;
  flex-direction: row;
  align-items: start;
`;

const $Ring = styled(Ring)`
  --ring-color: var(--color-accent);
`;

const $GreenCheckCircle = styled(GreenCheckCircle)`
  --icon-size: 2rem;
`;

const $WarningIcon = styled(Icon)`
  color: var(--color-warning);
  font-size: 1.5rem;
`;

const $PreviewTitle = styled.div`
  ${layoutMixins.inlineRow}
  height: var(--dialog-icon-size);
`;
