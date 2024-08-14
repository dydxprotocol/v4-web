import { DialogProps, FillDetailsDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
import { type DetailsItem } from '@/components/Details';
import { DetailsDialog } from '@/components/DetailsDialog';
import { OrderSideTag } from '@/components/OrderSideTag';
import { Output, OutputType } from '@/components/Output';

import { getFillDetails } from '@/state/accountSelectors';

import { MustBigNumber } from '@/lib/numbers';

export const FillDetailsDialog = ({ fillId, setIsOpen }: DialogProps<FillDetailsDialogProps>) => {
  const stringGetter = useStringGetter();

  const {
    asset,
    createdAtMilliseconds,
    displayId,
    fee,
    marketId,
    orderSide,
    price,
    resources,
    size,
    stepSizeDecimals,
    tickSizeDecimals,
  } = useParameterizedSelector(getFillDetails, fillId)! ?? {};

  const detailItems = (
    [
      {
        key: 'market',
        label: stringGetter({ key: STRING_KEYS.MARKET }),
        value: displayId,
      },
      {
        key: 'market-id',
        label: stringGetter({ key: STRING_KEYS.TICKER }),
        value: marketId,
      },
      {
        key: 'side',
        label: stringGetter({ key: STRING_KEYS.SIDE }),
        value: <OrderSideTag orderSide={orderSide!} />,
      },
      {
        key: 'liquidity',
        label: stringGetter({ key: STRING_KEYS.LIQUIDITY }),
        value: resources.liquidityStringKey
          ? stringGetter({ key: resources.liquidityStringKey })
          : null,
      },
      {
        key: 'amount',
        label: stringGetter({ key: STRING_KEYS.AMOUNT }),
        value: <Output type={OutputType.Asset} value={size} fractionDigits={stepSizeDecimals} />,
      },
      {
        key: 'price',
        label: stringGetter({ key: STRING_KEYS.PRICE }),
        value: <Output type={OutputType.Fiat} value={price} fractionDigits={tickSizeDecimals} />,
      },
      {
        key: 'total',
        label: stringGetter({ key: STRING_KEYS.TOTAL }),
        value: <Output type={OutputType.Fiat} value={MustBigNumber(price).times(size)} />,
      },
      {
        key: 'fee',
        label: stringGetter({
          key: STRING_KEYS.FEE,
        }),
        value: <Output type={OutputType.Fiat} value={MustBigNumber(fee)} />,
      },
      {
        key: 'created-at',
        label: stringGetter({ key: STRING_KEYS.CREATED_AT }),
        value: <Output type={OutputType.DateTime} value={createdAtMilliseconds} />,
      },
    ] satisfies DetailsItem[]
  ).filter((item) => Boolean(item.value));

  return (
    <DetailsDialog
      slotIcon={<AssetIcon symbol={asset?.id} tw="text-[1em]" />}
      title={resources.typeStringKey && stringGetter({ key: resources.typeStringKey })}
      items={detailItems}
      setIsOpen={setIsOpen}
    />
  );
};
