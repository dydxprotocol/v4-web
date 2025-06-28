import { BonsaiHelpers } from '@/bonsai/ontology';
import { SubaccountPosition } from '@/bonsai/types/summaryTypes';

import { ButtonAction } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS } from '@/constants/numbers';
import { EMPTY_ARR } from '@/constants/objects';

import { useEnvFeatures } from '@/hooks/useEnvFeatures';
import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType, ShowSign } from '@/components/Output';

import { getSubaccountConditionalOrders } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { orEmptyObj } from '@/lib/typeUtils';

export const MarketPositionCard = ({ position }: { position: SubaccountPosition }) => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const { isSlTpLimitOrdersEnabled } = useEnvFeatures();

  const { stepSizeDecimals = TOKEN_DECIMALS } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)
  );

  const tpslOrdersByPositionUniqueId = useAppSelectorWithArgs(
    getSubaccountConditionalOrders,
    isSlTpLimitOrdersEnabled
  );

  const {
    signedSize,
    netFunding,
    unrealizedPnl,
    entryPrice,
    liquidationPrice,
    notional,
    assetId,
    market,
    uniqueId,
  } = position;

  const tpOrder = (tpslOrdersByPositionUniqueId[uniqueId]?.takeProfitOrders ?? EMPTY_ARR).at(0);
  const slOrder = (tpslOrdersByPositionUniqueId[uniqueId]?.stopLossOrders ?? EMPTY_ARR).at(0);

  const positionInfo = [
    {
      label: stringGetter({ key: STRING_KEYS.SIZE }),
      value: (
        <Output
          type={OutputType.Number}
          showSign={ShowSign.None}
          value={signedSize}
          fractionDigits={stepSizeDecimals}
        />
      ),
    },
    {
      label: stringGetter({ key: STRING_KEYS.VALUE }),
      value: <Output type={OutputType.Fiat} value={notional} />,
    },
    {
      label: stringGetter({ key: STRING_KEYS.PROFIT }),
      value: <Output withSignColor type={OutputType.Fiat} value={unrealizedPnl} />,
    },
    {
      label: stringGetter({ key: STRING_KEYS.FUNDING_PAID }),
      value: <Output withSignColor type={OutputType.Fiat} value={netFunding} />,
    },
    {
      label: stringGetter({ key: STRING_KEYS.ENTRY }),
      value: <Output type={OutputType.Fiat} value={entryPrice} />,
    },
    {
      label: stringGetter({ key: STRING_KEYS.LIQUIDATION }),
      value: <Output type={OutputType.Fiat} value={liquidationPrice} />,
    },
  ];

  const onTriggerClicked = () => {
    dispatch(
      openDialog(
        DialogTypes.Triggers({
          marketId: market,
          assetId,
          positionUniqueId: uniqueId,
          navigateToMarketOrders: () => {},
        })
      )
    );
  };

  const renderTriggerOrderButtons = () => {
    if (tpOrder == null && slOrder == null) {
      return (
        <Button
          action={ButtonAction.SimpleSecondary}
          tw="flex-1 py-0.75"
          onClick={onTriggerClicked}
        >
          <div tw="row size-1.5 max-w-1.5 flex-1 items-center justify-center rounded-[50%] bg-color-layer-5">
            <Icon tw="ml-[1px] font-tiny-book" iconName={IconName.Plus} />
          </div>
          {stringGetter({ key: STRING_KEYS.ADD_TRIGGERS })}
        </Button>
      );
    }

    const tpButtonContent = tpOrder ? (
      <span tw="row flex-1 justify-between gap-0.5">
        <span tw="row gap-0.5">
          TP: <Output type={OutputType.Fiat} value={tpOrder.triggerPrice} />
        </span>
        <div tw="row size-1.5 max-w-1.5 flex-1 justify-center rounded-[50%] bg-color-layer-4">
          <Icon tw="font-tiny-book" iconName={IconName.Pencil2} />
        </div>
      </span>
    ) : (
      <span tw="row justify-between gap-0.5">
        TP
        <div tw="row size-1.5 flex-1 justify-center rounded-[50%] bg-color-layer-4">
          <Icon tw="font-tiny-book" iconName={IconName.Plus} />
        </div>
      </span>
    );

    const slButtonContent = slOrder ? (
      <span tw="row flex-1 justify-between gap-0.5">
        <span tw="row gap-0.5">
          {stringGetter({ key: STRING_KEYS.STOP_LOSS })}:
          <Output type={OutputType.Fiat} value={slOrder.triggerPrice} />
        </span>
        <div tw="row size-1.5 max-w-1.5 flex-1 justify-center rounded-[50%] bg-color-layer-4">
          <Icon tw="font-tiny-book" iconName={IconName.Pencil2} />
        </div>
      </span>
    ) : (
      <span tw="row flex-1 justify-between gap-0.5">
        {stringGetter({ key: STRING_KEYS.STOP_LOSS })}
        <div tw="row size-1.5 justify-center rounded-[50%] bg-color-layer-4">
          <Icon tw="font-tiny-book" iconName={IconName.Plus} />
        </div>
      </span>
    );

    return (
      <div tw="row gap-0.5">
        <Button tw="flex-1 justify-normal py-0.75" onClick={onTriggerClicked}>
          {tpButtonContent}
        </Button>
        <Button tw="flex-1 justify-normal py-0.75" onClick={onTriggerClicked}>
          {slButtonContent}
        </Button>
      </div>
    );
  };

  return (
    <div tw="flexColumn gap-1">
      <div tw="grid grid-cols-3 grid-rows-2 gap-y-0.75 p-0">
        {positionInfo.map((info) => (
          <div key={info.label}>
            <div tw="text-color-text-0 font-mini-book">{info.label}</div>
            <div tw="text-color-text-2">{info.value}</div>
          </div>
        ))}
      </div>

      {renderTriggerOrderButtons()}
    </div>
  );
};
