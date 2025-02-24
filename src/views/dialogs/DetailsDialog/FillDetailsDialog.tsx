import { DialogProps, FillDetailsDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
import { type DetailsItem } from '@/components/Details';
import { DetailsDialog } from '@/components/DetailsDialog';
import { OrderSideTag } from '@/components/OrderSideTag';
import { Output, OutputType } from '@/components/Output';
import {
  getIndexerFillTypeStringKey,
  getIndexerLiquidityStringKey,
} from '@/views/tables/enumToStringKeyHelpers';

import { getFillDetails } from '@/state/accountSelectors';

import { MustBigNumber } from '@/lib/numbers';

export const FillDetailsDialog = ({ fillId, setIsOpen }: DialogProps<FillDetailsDialogProps>) => {
  const stringGetter = useStringGetter();

  const {
    createdAt,
    fee,
    side,
    type,
    price,
    size,
    stepSizeDecimals,
    tickSizeDecimals,
    marketSummary,
    market,
    liquidity,
  } = useParameterizedSelector(getFillDetails, fillId) ?? {};

  const detailItems = (
    [
      {
        key: 'market',
        label: stringGetter({ key: STRING_KEYS.MARKET }),
        value: marketSummary?.displayableTicker,
      },
      {
        key: 'market-id',
        label: stringGetter({ key: STRING_KEYS.TICKER }),
        value: market,
      },
      {
        key: 'side',
        label: stringGetter({ key: STRING_KEYS.SIDE }),
        value: side != null ? <OrderSideTag orderSide={side} /> : undefined,
      },
      {
        key: 'liquidity',
        label: stringGetter({ key: STRING_KEYS.LIQUIDITY }),
        value:
          liquidity != null
            ? stringGetter({ key: getIndexerLiquidityStringKey(liquidity) })
            : undefined,
      },
      {
        key: 'amount',
        label: stringGetter({ key: STRING_KEYS.AMOUNT }),
        value: <Output type={OutputType.Asset} value={size} fractionDigits={stepSizeDecimals} />,
      },
      {
        key: 'price',
        label: stringGetter({ key: STRING_KEYS.PRICE }),
        value: (
          <Output
            withSubscript
            type={OutputType.Fiat}
            value={price}
            fractionDigits={tickSizeDecimals}
          />
        ),
      },
      {
        key: 'total',
        label: stringGetter({ key: STRING_KEYS.TOTAL }),
        value: (
          <Output type={OutputType.Fiat} value={MustBigNumber(price).times(MustBigNumber(size))} />
        ),
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
        value:
          createdAt != null ? (
            <Output type={OutputType.DateTime} value={new Date(createdAt).getTime()} />
          ) : undefined,
      },
    ] satisfies DetailsItem[]
  ).filter((item) => Boolean(item.value));

  return (
    <DetailsDialog
      slotIcon={<AssetIcon logoUrl={marketSummary?.logo} symbol={marketSummary?.assetId} />}
      title={type && stringGetter({ key: getIndexerFillTypeStringKey(type) })}
      items={detailItems}
      setIsOpen={setIsOpen}
    />
  );
};
