import { useMemo } from 'react';

import { PlaceOrderPayload } from '@/bonsai/forms/triggers/types';
import { OrderSide, OrderType } from '@dydxprotocol/v4-client-js';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { SimpleUiTradeDialogSteps } from '@/constants/trade';
import { IndexerOrderSide, IndexerOrderType } from '@/types/indexer/indexerApiGen';

import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';

import { getOrderByClientId } from '@/state/accountSelectors';

import { getDisplayableAssetFromTicker } from '@/lib/assetUtils';
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

  const { side, totalFilled, price, type, marketId } = useMemo(() => {
    if (currentStep === SimpleUiTradeDialogSteps.Submit) {
      return {
        side: payload?.side,
        totalFilled: payload?.size,
        price: payload?.price,
        type: payload?.type,
        marketId: payload?.marketId,
      };
    }

    if (currentStep === SimpleUiTradeDialogSteps.Confirm) {
      return {
        side: orderFromClientId.side,
        totalFilled: orderFromClientId.totalFilled,
        price: orderFromClientId.price,
        type: orderFromClientId.type,
        marketId: orderFromClientId.marketId,
      };
    }

    return {};
  }, [currentStep, payload, orderFromClientId]);

  const renderContent = () => {
    if (currentStep === SimpleUiTradeDialogSteps.Error) {
      return <span>{placeOrderError}</span>;
    }

    if (!marketId || !side) return null;

    const displayableAsset = getDisplayableAssetFromTicker(marketId);
    const typeString =
      type === IndexerOrderType.MARKET || type === OrderType.MARKET
        ? stringGetter({ key: STRING_KEYS.MARKET_ORDER })
        : type === IndexerOrderType.LIMIT || type === OrderType.LIMIT
          ? stringGetter({ key: STRING_KEYS.LIMIT_ORDER })
          : null;

    const sideString =
      side === IndexerOrderSide.BUY || side === OrderSide.BUY
        ? stringGetter({ key: STRING_KEYS.LONG_POSITION_SHORT })
        : side === IndexerOrderSide.SELL || side === OrderSide.SELL
          ? stringGetter({ key: STRING_KEYS.SHORT_POSITION_SHORT })
          : null;

    const sideColor =
      side === IndexerOrderSide.BUY || side === OrderSide.BUY
        ? 'var(--color-positive)'
        : side === IndexerOrderSide.SELL || side === OrderSide.SELL
          ? 'var(--color-negative)'
          : undefined;

    return (
      <div tw="flexColumn gap-0.5 text-center">
        <div tw="row gap-[0.5ch] font-extra-large-bold">
          <span css={{ color: sideColor }}>{sideString}</span>
          <Output type={OutputType.Asset} value={totalFilled} />
          <span>{displayableAsset}</span>
        </div>

        <span tw="font-medium-book">
          <span tw="text-color-text-2">{typeString}</span>
          <span tw="text-color-text-0"> @ </span>
          <Output tw="inline text-color-text-1" type={OutputType.Fiat} value={price} />
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
      const gradientColor =
        side === IndexerOrderSide.BUY
          ? 'var(--color-gradient-positive)'
          : 'var(--color-gradient-negative)';

      return (
        <div
          tw="pointer-events-none absolute inset-0 z-0 h-[50%]"
          css={{
            background: `radial-gradient(ellipse 100% 70% at 50% 0%, ${gradientColor} 0%, ${gradientColor} 70%, transparent 100%)`,
          }}
        />
      );
    }

    return null;
  };

  return (
    <div tw="flexColumn items-center gap-2 px-1.25 pb-1.25 pt-[15vh]">
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
          action={ButtonAction.Primary}
          size={ButtonSize.Medium}
          onClick={onClose}
        >
          {stringGetter({ key: STRING_KEYS.DONE })}
        </Button>
      </div>
    </div>
  );
};
