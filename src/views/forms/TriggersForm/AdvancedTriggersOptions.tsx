import { STRING_KEYS } from '@/constants/localization';

import { useEnvFeatures } from '@/hooks/useEnvFeatures';
import { useStringGetter } from '@/hooks/useStringGetter';

import { HorizontalSeparatorFiller } from '@/components/Separator';

import { LimitPriceInputs } from './LimitPriceInputs';
import { OrderSizeInput } from './OrderSizeInput';

type ElementProps = {
  symbol: string;
  existsLimitOrder: boolean;
  size: number | null;
  positionSize: number | null;
  differingOrderSizes: boolean;
  multipleTakeProfitOrders: boolean;
  multipleStopLossOrders: boolean;
  stepSizeDecimals?: number;
  tickSizeDecimals?: number;
};

type StyleProps = {
  className?: string;
};

export const AdvancedTriggersOptions = ({
  symbol,
  existsLimitOrder,
  size,
  positionSize,
  differingOrderSizes,
  multipleTakeProfitOrders,
  multipleStopLossOrders,
  stepSizeDecimals,
  tickSizeDecimals,
  className,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();
  const { isSlTpLimitOrdersEnabled } = useEnvFeatures();

  return (
    <div tw="column">
      <h3 tw="inlineRow mb-0.5 text-text-0 font-small-medium">
        {stringGetter({ key: STRING_KEYS.ADVANCED })}
        <HorizontalSeparatorFiller />
      </h3>
      <div tw="grid gap-[0.5em]">
        <OrderSizeInput
          className={className}
          differingOrderSizes={differingOrderSizes}
          symbol={symbol}
          size={size}
          positionSize={positionSize}
          stepSizeDecimals={stepSizeDecimals}
        />
        {isSlTpLimitOrdersEnabled && (
          <LimitPriceInputs
            className={className}
            existsLimitOrder={existsLimitOrder}
            multipleTakeProfitOrders={multipleTakeProfitOrders}
            multipleStopLossOrders={multipleStopLossOrders}
            tickSizeDecimals={tickSizeDecimals}
          />
        )}
      </div>
    </div>
  );
};
