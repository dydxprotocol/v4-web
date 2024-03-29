import { useState } from 'react';

import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import styled, { AnyStyledComponent, css } from 'styled-components';

import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { MobilePlaceOrderSteps } from '@/constants/trade';

import { useBreakpoints, useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Dialog, DialogPlacement } from '@/components/Dialog';
import { GreenCheckCircle } from '@/components/GreenCheckCircle';
import { Ring } from '@/components/Ring';
import { TradeForm } from '@/views/forms/TradeForm';

import { openDialog } from '@/state/dialogs';
import { getInputTradeData } from '@/state/inputsSelectors';

import { testFlags } from '@/lib/testFlags';

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
  const currentTradeData = useSelector(getInputTradeData, shallowEqual);

  const [currentStep, setCurrentStep] = useState<MobilePlaceOrderSteps>(
    MobilePlaceOrderSteps.EditOrder
  );

  const onCloseDialog = () => {
    setCurrentStep(MobilePlaceOrderSteps.EditOrder);
    setIsOpen?.(false);
  };

  return (
    <Styled.Dialog
      isOpen={isOpen}
      setIsOpen={(open: boolean) => (open ? setIsOpen?.(true) : onCloseDialog())}
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
      currentStep={currentStep}
      slotTrigger={slotTrigger}
      hasHeaderBorder
      {...{
        [MobilePlaceOrderSteps.EditOrder]: {
          title: testFlags.isolatedMargin ? (
            <Styled.EditTradeHeader>
              <Button
                onClick={() => {
                  dispatch(
                    openDialog({
                      type: DialogTypes.SelectMarginMode,
                    })
                  );
                }}
              >
                {stringGetter({ key: STRING_KEYS.CROSS })}
              </Button>

              <Button
                onClick={() => {
                  dispatch(openDialog({ type: DialogTypes.AdjustTargetLeverage }));
                }}
              >
                1x
              </Button>

              <TradeSideToggle />
            </Styled.EditTradeHeader>
          ) : (
            <TradeSideToggle />
          ),
        },
        [MobilePlaceOrderSteps.PreviewOrder]: {
          title: (
            <Styled.PreviewTitle>
              {stringGetter({ key: STRING_KEYS.PREVIEW_ORDER_TITLE })}
            </Styled.PreviewTitle>
          ),
          description: stringGetter({ key: STRING_KEYS.PREVIEW_ORDER_DESCRIPTION }),
        },
        [MobilePlaceOrderSteps.PlacingOrder]: {
          title: stringGetter({ key: STRING_KEYS.PLACING_ORDER_TITLE }),
          description: stringGetter({ key: STRING_KEYS.PLACING_ORDER_DESCRIPTION }),
          slotIcon: <Styled.Ring withAnimation value={0.25} />,
        },
        // TODO(@aforaleka): add error state if trade didn't actually go through
        [MobilePlaceOrderSteps.Confirmation]: {
          title: stringGetter({ key: STRING_KEYS.CONFIRMED_TITLE }),
          description: stringGetter({ key: STRING_KEYS.CONFIRMED_DESCRIPTION }),
          slotIcon: <Styled.GreenCheckCircle />,
        },
      }[currentStep]}
    >
      <Styled.TradeForm
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        onConfirm={onCloseDialog}
      />
    </Styled.Dialog>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Dialog = styled(Dialog)<{ currentStep: MobilePlaceOrderSteps }>`
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

Styled.EditTradeHeader = styled.div`
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 0.5rem;
`;

Styled.TradeForm = styled(TradeForm)`
  --tradeBox-content-paddingTop: 1rem;
  --tradeBox-content-paddingRight: 1.5rem;
  --tradeBox-content-paddingBottom: 1.5rem;
  --tradeBox-content-paddingLeft: 1.5rem;
`;

Styled.Ring = styled(Ring)`
  --ring-color: var(--color-accent);
`;

Styled.GreenCheckCircle = styled(GreenCheckCircle)`
  --icon-size: 2rem;
`;

Styled.PreviewTitle = styled.div`
  ${layoutMixins.inlineRow}
  height: var(--dialog-icon-size);
`;
