import { useMemo } from 'react';

import { PlaceOrderPayload } from '@/bonsai/forms/triggers/types';
import { BonsaiHelpers } from '@/bonsai/ontology';
import { OrderSide } from '@dydxprotocol/v4-client-js';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { ORDER_TYPE_STRINGS, SimpleUiTradeDialogSteps } from '@/constants/trade';
import { IndexerOrderSide } from '@/types/indexer/indexerApiGen';

import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';

import { getOrderByClientId } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import { getDisplayableAssetFromTicker } from '@/lib/assetUtils';
import {
  getIndexerOrderTypeStringKey,
  getPositionSideStringKeyFromOrderSide,
} from '@/lib/enumToStringKeyHelpers';
import { MustBigNumber } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

export const SimpleTradeSteps = ({
  clientId,
  currentStep,
  payload,
  placeOrderError,
  onClose,
}: {
  clientId?: string;
  currentStep: SimpleUiTradeDialogSteps;
  payload?: PlaceOrderPayload;
  placeOrderError?: string;
  onClose: () => void;
}) => {
  const stringGetter = useStringGetter();
  const orderFromClientId = orEmptyObj(useAppSelectorWithArgs(getOrderByClientId, clientId ?? ''));

  const { stepSizeDecimals, tickSizeDecimals, stepSize } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)
  );

  const { side, price, marketId, typeString, sideString, sideColor, size } = useMemo(() => {
    if (currentStep === SimpleUiTradeDialogSteps.Submit) {
      const orderTypeKey = payload?.type && ORDER_TYPE_STRINGS[payload.type].orderTypeKey;
      const orderSideKey = payload?.side ? getPositionSideStringKeyFromOrderSide(payload.side) : '';

      return {
        side: payload?.side,
        totalFilled: payload?.size,
        price: payload?.price,
        type: payload?.type,
        marketId: payload?.marketId,
        typeString: orderTypeKey && stringGetter({ key: orderTypeKey }),
        sideString: orderSideKey && stringGetter({ key: orderSideKey }),
        sideColor: {
          [OrderSide.BUY]: 'var(--color-positive)',
          [OrderSide.SELL]: 'var(--color-negative)',
        }[payload?.side ?? OrderSide.BUY],
        size: payload?.size ?? orderFromClientId.size,
      };
    }

    if (currentStep === SimpleUiTradeDialogSteps.Confirm) {
      const orderTypeKey =
        orderFromClientId.type && getIndexerOrderTypeStringKey(orderFromClientId.type);
      const orderSideKey =
        orderFromClientId.side && getPositionSideStringKeyFromOrderSide(orderFromClientId.side);

      return {
        side: orderFromClientId.side,
        totalFilled: orderFromClientId.totalFilled,
        price: orderFromClientId.price,
        type: orderFromClientId.type,
        marketId: orderFromClientId.marketId,
        typeString: orderTypeKey && stringGetter({ key: orderTypeKey }),
        sideString: orderSideKey && stringGetter({ key: orderSideKey }),
        sideColor: {
          [IndexerOrderSide.BUY]: 'var(--color-positive)',
          [IndexerOrderSide.SELL]: 'var(--color-negative)',
        }[orderFromClientId.side ?? IndexerOrderSide.BUY],
        size: orderFromClientId.size,
      };
    }

    return {};
  }, [currentStep, payload, orderFromClientId, stringGetter]);

  const renderContent = () => {
    if (currentStep === SimpleUiTradeDialogSteps.Error) {
      return <span tw="text-center text-color-text-2">{placeOrderError}</span>;
    }

    if (!marketId || !side) return null;

    const displayableAsset = getDisplayableAssetFromTicker(marketId);

    const canCompactNumber = stepSize && MustBigNumber(stepSize).gte(1);

    return (
      <div tw="flexColumn gap-0.5 text-center">
        <div tw="row gap-[0.5ch] text-color-text-2 font-extra-large-bold">
          <span css={{ color: sideColor }}>{sideString}</span>
          <Output
            type={canCompactNumber ? OutputType.CompactNumber : OutputType.Number}
            value={size}
            fractionDigits={stepSizeDecimals}
          />
          <span>{displayableAsset}</span>
        </div>

        <span tw="font-medium-book">
          <span tw="text-color-text-2">{typeString}</span>
          <span tw="text-color-text-0"> @ </span>
          <Output
            withSubscript
            tw="inline text-color-text-1"
            type={OutputType.Fiat}
            value={price}
            fractionDigits={tickSizeDecimals}
          />
        </span>
      </div>
    );
  };

  const renderIcon = () => {
    if (currentStep === SimpleUiTradeDialogSteps.Error) {
      return (
        <div tw="row size-4 justify-center rounded-[50%] bg-color-gradient-error">
          <Icon iconName={IconName.ErrorExclamation} tw="size-2 text-color-error" />
        </div>
      );
    }

    if (currentStep === SimpleUiTradeDialogSteps.Confirm) {
      return (
        <div tw="row size-4 justify-center rounded-[50%] bg-color-gradient-success">
          <Icon iconName={IconName.Check} tw="size-2 text-color-success" />
        </div>
      );
    }

    return <LoadingSpinner tw="size-4" size="4rem" />;
  };

  const renderGradient = () => {
    if (currentStep === SimpleUiTradeDialogSteps.Confirm) {
      const gradientStops =
        side === OrderSide.BUY
          ? [
              'var(--color-positive-50)',
              'var(--color-positive-20)',
              'var(--color-gradient-positive)',
            ]
          : [
              'var(--color-negative-50)',
              'var(--color-negative-20)',
              'var(--color-gradient-negative)',
            ];

      return (
        <div
          tw="pointer-events-none absolute inset-0 z-0 h-[100%]"
          css={{
            background: `radial-gradient(
              ellipse 99.36% 45.83% at 50% 0%,
              ${gradientStops[0]} 0%,
              ${gradientStops[1]} 40%,
              ${gradientStops[2]} 55%,
              rgba(0, 0, 0, 0.0) 100%
            )`,
          }}
        />
      );
    }

    return null;
  };

  return (
    <div tw="flexColumn items-center gap-2 pt-[40%]">
      {renderGradient()}
      <div tw="flexColumn z-[1] w-full flex-1 items-center gap-1.5">
        {renderIcon()}
        {renderContent()}
      </div>

      <div tw="flexColumn w-full">
        <Button
          tw="w-full rounded-[1rem]"
          type={ButtonType.Button}
          state={{
            isLoading: currentStep === SimpleUiTradeDialogSteps.Submit,
          }}
          action={ButtonAction.SimplePrimary}
          size={ButtonSize.Large}
          onClick={onClose}
        >
          {stringGetter({ key: STRING_KEYS.DONE })}
        </Button>
      </div>
    </div>
  );
};
