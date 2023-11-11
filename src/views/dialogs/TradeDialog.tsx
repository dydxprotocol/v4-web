import { useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import styled, { AnyStyledComponent, css } from 'styled-components';

import { TradeInputField } from '@/constants/abacus';
import { STRING_KEYS, StringKey } from '@/constants/localization';
import { TradeTypes, TRADE_TYPE_STRINGS, MobilePlaceOrderSteps } from '@/constants/trade';

import { useBreakpoints, useStringGetter } from '@/hooks';
import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Dialog, DialogPlacement } from '@/components/Dialog';
import { GreenCheckCircle } from '@/components/GreenCheckCircle';
import { TradeForm } from '@/views/forms/TradeForm';
import { Ring } from '@/components/Ring';
import { ToggleGroup } from '@/components/ToggleGroup';

import { getCurrentMarketAssetData } from '@/state/assetsSelectors';
import { getInputTradeData, getInputTradeOptions } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';
import { getSelectedTradeType } from '@/lib/tradeData';

type ElementProps = {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  slotTrigger?: React.ReactNode;
};

export const TradeDialog = ({ isOpen, setIsOpen, slotTrigger }: ElementProps) => {
  const { isMobile } = useBreakpoints();
  const stringGetter = useStringGetter();
  const { id } = useSelector(getCurrentMarketAssetData, shallowEqual) ?? {};
  const currentTradeData = useSelector(getInputTradeData, shallowEqual);
  const { type } = currentTradeData || {};
  const selectedTradeType = getSelectedTradeType(type);
  const { typeOptions } = useSelector(getInputTradeOptions, shallowEqual) ?? {};

  const allTradeTypeItems = (typeOptions?.toArray() ?? []).map(({ type, stringKey }) => ({
    value: type,
    label: stringGetter({
      key: stringKey as StringKey,
    }),
    slotBefore: <AssetIcon symbol={id} />,
  }));

  const [currentStep, setCurrentStep] = useState<MobilePlaceOrderSteps>(
    MobilePlaceOrderSteps.EditOrder
  );

  const onTradeTypeChange = (tradeType: TradeTypes) => {
    abacusStateManager.clearTradeInputValues();
    abacusStateManager.setTradeValue({ value: tradeType, field: TradeInputField.type });
  };

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
          title: (
            <Styled.ToggleGroup
              items={allTradeTypeItems}
              value={selectedTradeType}
              onValueChange={onTradeTypeChange}
            />
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

Styled.ToggleGroup = styled(ToggleGroup)`
  overflow-x: auto;

  button[data-state='off'] {
    gap: 0;

    img {
      height: 0;
    }
  }
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
