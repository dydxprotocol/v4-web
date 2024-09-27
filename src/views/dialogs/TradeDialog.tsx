import { useState } from 'react';

import styled, { css } from 'styled-components';

import { DialogProps, TradeDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { MobilePlaceOrderSteps } from '@/constants/trade';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Dialog, DialogPlacement } from '@/components/Dialog';
import { GreenCheckCircle } from '@/components/GreenCheckCircle';
import { Icon, IconName } from '@/components/Icon';
import { Ring } from '@/components/Ring';
import { TradeForm } from '@/views/forms/TradeForm';

import { MarginModeSelector } from '../forms/TradeForm/MarginModeSelector';
import { TargetLeverageButton } from '../forms/TradeForm/TargetLeverageButton';
import { TradeSideToggle } from '../forms/TradeForm/TradeSideToggle';

export const TradeDialog = ({ isOpen, setIsOpen, slotTrigger }: DialogProps<TradeDialogProps>) => {
  const { isMobile } = useBreakpoints();
  const stringGetter = useStringGetter();
  const [currentStep, setCurrentStep] = useState<MobilePlaceOrderSteps>(
    MobilePlaceOrderSteps.EditOrder
  );

  const onCloseDialog = () => {
    setCurrentStep(MobilePlaceOrderSteps.EditOrder);
    setIsOpen?.(false);
  };

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
            <$TopActionsRow tw="flex gap-0.5">
              <$MarginAndLeverageButtons tw="flex gap-0.5">
                <MarginModeSelector openInTradeBox={false} tw="flex-1" />
                <$TargetLeverageButton />
              </$MarginAndLeverageButtons>

              <TradeSideToggle />
            </$TopActionsRow>
          ),
        },
        [MobilePlaceOrderSteps.PreviewOrder]: {
          title: (
            <div tw="inlineRow h-[--dialog-icon-size]">
              {stringGetter({ key: STRING_KEYS.PREVIEW_ORDER_TITLE })}
            </div>
          ),
          description: stringGetter({ key: STRING_KEYS.PREVIEW_ORDER_DESCRIPTION }),
        },
        [MobilePlaceOrderSteps.PlacingOrder]: {
          title: stringGetter({ key: STRING_KEYS.PLACING_ORDER_TITLE }),
          description: stringGetter({ key: STRING_KEYS.PLACING_ORDER_DESCRIPTION }),
          slotIcon: <Ring withAnimation value={0.25} tw="[--ring-color:--color-accent]" />,
        },
        [MobilePlaceOrderSteps.PlaceOrderFailed]: {
          title: stringGetter({ key: STRING_KEYS.PLACE_ORDER_FAILED }),
          description: stringGetter({ key: STRING_KEYS.PLACE_ORDER_FAILED_DESCRIPTION }),
          slotIcon: <Icon iconName={IconName.Warning} tw="text-[1.5rem] text-color-warning" />,
        },
        [MobilePlaceOrderSteps.Confirmation]: {
          title: stringGetter({ key: STRING_KEYS.CONFIRMED_TITLE }),
          description: stringGetter({ key: STRING_KEYS.CONFIRMED_DESCRIPTION }),
          slotIcon: <GreenCheckCircle tw="[--icon-size:2rem]" />,
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

const $TopActionsRow = styled.div`
  > * {
    ${layoutMixins.flexExpandToSpace}
  }
`;

const $MarginAndLeverageButtons = styled.div`
  abbr,
  button {
    ${layoutMixins.flexExpandToSpace}
  }
`;

const $TargetLeverageButton = styled(TargetLeverageButton)`
  flex: 1;

  button {
    width: 100%;
  }
`;

const $TradeForm = styled(TradeForm)`
  --tradeBox-content-paddingTop: 1rem;
  --tradeBox-content-paddingRight: 1.5rem;
  --tradeBox-content-paddingBottom: 1.5rem;
  --tradeBox-content-paddingLeft: 1.5rem;
`;
