import { useState } from 'react';

import { shallowEqual } from 'react-redux';
import styled, { css } from 'styled-components';

import { ClosePositionDialogProps, DialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { MobilePlaceOrderSteps } from '@/constants/trade';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Dialog, DialogPlacement } from '@/components/Dialog';
import { GreenCheckCircle } from '@/components/GreenCheckCircle';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { Ring } from '@/components/Ring';
import { VerticalSeparator } from '@/components/Separator';
import { MidMarketPrice } from '@/views/MidMarketPrice';
import { ClosePositionForm } from '@/views/forms/ClosePositionForm';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketAssetData } from '@/state/assetsSelectors';
import { getCurrentMarketData } from '@/state/perpetualsSelectors';

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber } from '@/lib/numbers';

export const ClosePositionDialog = ({ setIsOpen }: DialogProps<ClosePositionDialogProps>) => {
  const { id } = useAppSelector(getCurrentMarketAssetData, shallowEqual) ?? {};
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
      slotIcon: <AssetIcon symbol={id} />,
    },
    [MobilePlaceOrderSteps.PreviewOrder]: {
      title: (
        <div tw="inlineRow h-[var(--dialog-icon-size)]">
          {stringGetter({ key: STRING_KEYS.PREVIEW_ORDER_TITLE })}
        </div>
      ),
      description: stringGetter({ key: STRING_KEYS.PREVIEW_ORDER_DESCRIPTION }),
    },
    [MobilePlaceOrderSteps.PlacingOrder]: {
      title: stringGetter({ key: STRING_KEYS.PLACING_ORDER_TITLE }),
      description: stringGetter({ key: STRING_KEYS.PLACING_ORDER_DESCRIPTION }),
      slotIcon: <Ring withAnimation value={0.25} tw="[--ring-color:var(--color-accent)]" />,
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
  };

  return (
    <$Dialog
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
    </$Dialog>
  );
};

const CloseOrderHeader = () => {
  const stringGetter = useStringGetter();
  const { priceChange24H, priceChange24HPercent } =
    useAppSelector(getCurrentMarketData, shallowEqual) ?? {};

  return (
    <div tw="spacedRow">
      <h2>{stringGetter({ key: STRING_KEYS.CLOSE })}</h2>
      <div tw="inlineRow mr-0.5 gap-1">
        <$MarketDetails>
          <MidMarketPrice />
          <$PriceChange
            type={OutputType.Percent}
            value={MustBigNumber(priceChange24HPercent).abs()}
            isNegative={MustBigNumber(priceChange24H).isNegative()}
          />
        </$MarketDetails>
        <$VerticalSeparator />
      </div>
    </div>
  );
};
const $Dialog = styled(Dialog)<{ currentStep: MobilePlaceOrderSteps }>`
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
const $MarketDetails = styled.div`
  ${layoutMixins.rowColumn}
  justify-items: flex-end;
  font: var(--font-medium-medium);
`;

const $PriceChange = styled(Output)<{ isNegative?: boolean }>`
  font: var(--font-base-book);
  color: ${({ isNegative }) => (isNegative ? `var(--color-negative)` : `var(--color-positive)`)};
`;

const $VerticalSeparator = styled(VerticalSeparator)`
  && {
    height: 3rem;
  }
`;
