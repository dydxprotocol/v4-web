import { useCallback, useEffect, useMemo, useState } from 'react';

import { ExecutionType, OrderSide, TimeInForce, TradeFormType } from '@/bonsai/forms/trade/types';
import { BonsaiHelpers } from '@/bonsai/ontology';

import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { DialogProps, SimpleUiTradeDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { SimpleUiTradeDialogSteps } from '@/constants/trade';

import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
import { Dialog, DialogPlacement } from '@/components/Dialog';
import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Output, OutputType } from '@/components/Output';
import { DropdownMenuTrigger, SimpleUiDropdownMenu } from '@/components/SimpleUiDropdownMenu';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { closePositionFormActions } from '@/state/closePositionForm';
import { tradeFormActions } from '@/state/tradeForm';
import { getTradeFormValues } from '@/state/tradeFormSelectors';

import { assertNever } from '@/lib/assertNever';
import { orEmptyObj } from '@/lib/typeUtils';

import { SimpleCloseForm } from './SimpleCloseForm';
import { SimpleTradeForm } from './SimpleTradeForm';

export const SimpleUiTradeDialog = ({
  setIsOpen,
  ...props
}: DialogProps<SimpleUiTradeDialogProps>) => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const midMarketPrice = useAppSelector(BonsaiHelpers.currentMarket.midPrice.data);
  const currentTradeData = useAppSelector(getTradeFormValues);
  const { type: selectedTradeType } = currentTradeData;
  const side = 'side' in props ? props.side : undefined;
  const isClosingPosition = 'isClosingPosition' in props ? props.isClosingPosition : undefined;

  const { displayableAsset, logo, ticker } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)
  );

  useEffect(() => {
    if (isClosingPosition) {
      dispatch(closePositionFormActions.setMarketId(ticker));
    } else if (side) {
      dispatch(tradeFormActions.setOrderType(TradeFormType.MARKET));
      dispatch(tradeFormActions.setSide(side));
      dispatch(tradeFormActions.setExecution(ExecutionType.IOC));
    }
  }, [dispatch, side, ticker, isClosingPosition]);

  const onTradeTypeChange = useCallback(
    (tradeType: TradeFormType) => {
      if (!side) {
        return;
      }

      dispatch(tradeFormActions.reset());
      dispatch(tradeFormActions.setSide(side));
      dispatch(tradeFormActions.setOrderType(tradeType));

      if (tradeType === TradeFormType.MARKET) {
        dispatch(tradeFormActions.setExecution(ExecutionType.IOC));
      } else {
        dispatch(tradeFormActions.setTimeInForce(TimeInForce.GTT));
      }
    },
    [dispatch, side]
  );

  const [currentStep, setCurrentStep] = useState<SimpleUiTradeDialogSteps>(
    SimpleUiTradeDialogSteps.Edit
  );

  const onCloseDialog = useCallback(() => {
    setCurrentStep(SimpleUiTradeDialogSteps.Edit);
    setIsOpen(false);

    if (isClosingPosition) {
      dispatch(closePositionFormActions.reset());
    } else {
      dispatch(tradeFormActions.reset());
    }
  }, [setCurrentStep, setIsOpen, dispatch, isClosingPosition]);

  const title = useMemo(() => {
    switch (currentStep) {
      case SimpleUiTradeDialogSteps.Edit: {
        const sideString =
          side === OrderSide.BUY
            ? stringGetter({ key: STRING_KEYS.LONG_POSITION_SHORT })
            : stringGetter({ key: STRING_KEYS.SHORT_POSITION_SHORT });

        const sideColor =
          side === OrderSide.BUY ? 'var(--color-positive)' : 'var(--color-negative)';

        const editTitleContent = isClosingPosition ? (
          <div tw="row">
            <AssetIcon
              css={{
                '--asset-icon-size': '2.625rem',
              }}
              logoUrl={logo}
            />
            <div tw="flexColumn ml-0.75">
              <span tw="text-color-text-0 font-small-book">
                {stringGetter({ key: STRING_KEYS.CLOSE_POSITION })}
              </span>
              <span tw="font-medium-bold">
                <span>{displayableAsset}</span>
              </span>
            </div>
          </div>
        ) : (
          <>
            <div tw="row">
              <IconButton
                tw="border-none bg-[var(--simpleUi-dialog-backgroundColor)]"
                shape={ButtonShape.Square}
                size={ButtonSize.Small}
                iconName={IconName.ChevronLeft}
                onClick={onCloseDialog}
              />
              <AssetIcon
                css={{
                  '--asset-icon-size': '2.625rem',
                }}
                logoUrl={logo}
              />
              <div tw="flexColumn ml-0.75">
                <span tw="font-medium-bold">
                  <span css={{ color: sideColor }}>{sideString}</span>{' '}
                  <span>{displayableAsset}</span>
                </span>
                <span tw="text-color-text-0 font-small-book">
                  {stringGetter({ key: STRING_KEYS.PRICE })}{' '}
                  <Output
                    tw="inline text-color-text-1"
                    type={OutputType.Fiat}
                    value={midMarketPrice}
                  />
                </span>
              </div>
            </div>

            <SimpleUiDropdownMenu
              withPortal={false}
              items={[
                {
                  value: TradeFormType.MARKET,
                  active: selectedTradeType === TradeFormType.MARKET,
                  label: stringGetter({ key: STRING_KEYS.MARKET_ORDER_SHORT }),
                  onSelect: () => onTradeTypeChange(TradeFormType.MARKET),
                },
                {
                  value: TradeFormType.LIMIT,
                  active: selectedTradeType === TradeFormType.LIMIT,
                  label: stringGetter({ key: STRING_KEYS.LIMIT_ORDER_SHORT }),
                  onSelect: () => onTradeTypeChange(TradeFormType.LIMIT),
                },
              ]}
            >
              <DropdownMenuTrigger
                tw="bg-[var(--simpleUi-dialog-secondaryColor)]"
                shape={ButtonShape.Pill}
                size={ButtonSize.Base}
              >
                {selectedTradeType === TradeFormType.MARKET
                  ? stringGetter({ key: STRING_KEYS.MARKET_ORDER_SHORT })
                  : stringGetter({ key: STRING_KEYS.LIMIT_ORDER_SHORT })}
              </DropdownMenuTrigger>
            </SimpleUiDropdownMenu>
          </>
        );

        return <div tw="row justify-between">{editTitleContent}</div>;
      }
      case SimpleUiTradeDialogSteps.Submit:
        return (
          <div>
            <span>{stringGetter({ key: STRING_KEYS.SUBMITTING_ORDER })}</span>
          </div>
        );
      case SimpleUiTradeDialogSteps.Confirm:
        return (
          <div>
            <span>{stringGetter({ key: STRING_KEYS.TRADE_CONFIRMED })}</span>
          </div>
        );
      case SimpleUiTradeDialogSteps.Error:
        return (
          <div>
            <span>{stringGetter({ key: STRING_KEYS.ERROR_SUBMITTING })}</span>
          </div>
        );
      default:
        assertNever(currentStep, true);
    }

    return null;
  }, [
    currentStep,
    side,
    displayableAsset,
    logo,
    stringGetter,
    onTradeTypeChange,
    midMarketPrice,
    selectedTradeType,
    onCloseDialog,
    isClosingPosition,
  ]);

  return (
    <Dialog
      isOpen
      setIsOpen={(open: boolean) => {
        if (open) {
          setIsOpen(true);
        } else {
          onCloseDialog();
        }
      }}
      placement={DialogPlacement.FullScreen} // Simple UI is always full screen
      title={title}
      withClose={isClosingPosition ? true : currentStep !== SimpleUiTradeDialogSteps.Edit}
      css={{
        '--simpleUi-dialog-backgroundColor': 'var(--color-layer-1)',
        '--simpleUi-dialog-secondaryColor': 'var(--color-layer-2)',
        '--dialog-backgroundColor': 'var(--simpleUi-dialog-backgroundColor)',
        '--dialog-header-backgroundColor':
          currentStep === SimpleUiTradeDialogSteps.Edit
            ? 'var(--simpleUi-dialog-backgroundColor)'
            : 'transparent', // When submitting and confirming we want a transparent header to not interfere with radial-gradient
      }}
    >
      {isClosingPosition ? (
        <SimpleCloseForm
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          onClose={onCloseDialog}
        />
      ) : (
        <SimpleTradeForm
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          onClose={onCloseDialog}
        />
      )}
    </Dialog>
  );
};
