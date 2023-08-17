import { useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import styled, { AnyStyledComponent, css } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { MobilePlaceOrderSteps } from '@/constants/trade';

import { useBreakpoints, useStringGetter } from '@/hooks';
import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon, AssetSymbol } from '@/components/AssetIcon';
import { ClosePositionForm } from '@/views/forms/ClosePositionForm';
import { Dialog, DialogPlacement } from '@/components/Dialog';
import { GreenCheckCircle } from '@/components/GreenCheckCircle';
import { Ring } from '@/components/Ring';
import { VerticalSeparator } from '@/components/Separator';
import { MidMarketPrice } from '@/views/MidMarketPrice';
import { Output, OutputType } from '@/components/Output';

import { getCurrentMarketAssetData } from '@/state/assetsSelectors';
import { getCurrentMarketData } from '@/state/perpetualsSelectors';

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber } from '@/lib/numbers';

type ElementProps = {
  setIsOpen?: (open: boolean) => void;
};

export const ClosePositionDialog = ({ setIsOpen }: ElementProps) => {
  const { symbol } = useSelector(getCurrentMarketAssetData, shallowEqual) ?? {};
  const { isTablet } = useBreakpoints();
  const stringGetter = useStringGetter();

  const [currentStep, setCurrentStep] = useState<MobilePlaceOrderSteps>(
    MobilePlaceOrderSteps.EditOrder
  );

  const dialogProps: {
    [key in MobilePlaceOrderSteps]: {
      title: string | JSX.Element;
      description?: string;
      slotIcon?: JSX.Element;
      dialogIconSize?: string;
    };
  } = {
    [MobilePlaceOrderSteps.EditOrder]: {
      title: <CloseOrderHeader />,
      slotIcon: symbol ? <AssetIcon symbol={symbol as unknown as AssetSymbol} /> : undefined,
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
  };

  return (
    <Styled.Dialog
      isOpen={isTablet}
      setIsOpen={(isOpen: boolean) => {
        setIsOpen?.(isOpen);
        if (!isOpen)
          abacusStateManager.clearClosePositionInputValues({ shouldFocusOnTradeInput: true });
      }}
      slotIcon={dialogProps[currentStep].slotIcon}
      title={dialogProps[currentStep].title}
      description={dialogProps[currentStep].description}
      placement={DialogPlacement.FullScreen}
      hasHeaderBorder
      currentStep={currentStep}
    >
      <ClosePositionForm currentStep={currentStep} setCurrentStep={setCurrentStep} />
    </Styled.Dialog>
  );
};

const CloseOrderHeader = () => {
  const stringGetter = useStringGetter();
  const { priceChange24H, priceChange24HPercent } =
    useSelector(getCurrentMarketData, shallowEqual) ?? {};

  return (
    <Styled.CloseOrderHeader>
      <h2>{stringGetter({ key: STRING_KEYS.CLOSE })}</h2>
      <Styled.Right>
        <Styled.MarketDetails>
          <MidMarketPrice />
          <Styled.PriceChange
            type={OutputType.Percent}
            value={MustBigNumber(priceChange24HPercent).abs()}
            isNegative={MustBigNumber(priceChange24H).isNegative()}
          />
        </Styled.MarketDetails>
        <Styled.VerticalSeparator />
      </Styled.Right>
    </Styled.CloseOrderHeader>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Dialog = styled(Dialog)<{ currentStep: MobilePlaceOrderSteps }>`
  --dialog-backgroundColor: var(--color-layer-2);
  --dialog-header-height: 1rem;
  --dialog-content-paddingTop: 1.5rem;
  --dialog-content-paddingBottom: 1.25rem;
  --dialog-content-paddingLeft: 1.5rem;
  --dialog-content-paddingRight: 1.5rem;
  --dialog-icon-size: 2rem;

  ${({ currentStep }) =>
    currentStep === MobilePlaceOrderSteps.EditOrder &&
    css`
      --dialog-icon-size: 2.5rem;
    `}
`;

Styled.Ring = styled(Ring)`
  --ring-color: var(--color-accent);
`;

Styled.GreenCheckCircle = styled(GreenCheckCircle)`
  --icon-size: 2rem;
`;

Styled.CloseOrderHeader = styled.div`
  ${layoutMixins.spacedRow}
`;

Styled.Right = styled.div`
  ${layoutMixins.inlineRow}
  gap: 1rem;
  margin-right: 0.5rem;
`;

Styled.MarketDetails = styled.div`
  ${layoutMixins.rowColumn}
  justify-items: flex-end;
  font: var(--font-medium-medium);
`;

Styled.PriceChange = styled(Output)<{ isNegative?: boolean }>`
  font: var(--font-base-book);
  color: ${({ isNegative }) => (isNegative ? `var(--color-negative)` : `var(--color-positive)`)};
`;

Styled.VerticalSeparator = styled(VerticalSeparator)`
  && {
    height: 3rem;
  }
`;

Styled.PreviewTitle = styled.div`
  ${layoutMixins.inlineRow}
  height: var(--dialog-icon-size);
`;
