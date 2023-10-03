import { useSelector } from 'react-redux';
import styled, { AnyStyledComponent } from 'styled-components';
import { DateTime } from 'luxon';

import { STRING_KEYS } from '@/constants/localization';
import { useStringGetter } from '@/hooks';

import { AssetIcon } from '@/components/AssetIcon';
import { type DetailsItem } from '@/components/Details';
import { DetailsDialog } from '@/components/DetailsDialog';
import { OrderSideTag } from '@/components/OrderSideTag';
import { Output, OutputType } from '@/components/Output';
import { type FillTableRow } from '@/views/tables/FillsTable';

import { getFillDetails } from '@/state/accountSelectors';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { MustBigNumber } from '@/lib/numbers';

type ElementProps = {
  fillId: string;
  setIsOpen: (open: boolean) => void;
};

export const FillDetailsDialog = ({ fillId, setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();
  const selectedLocale = useSelector(getSelectedLocale);

  const {
    asset,
    createdAtMilliseconds,
    fee,
    marketId,
    orderSide,
    price,
    resources,
    size,
    stepSizeDecimals,
    tickSizeDecimals,
  } = (useSelector(getFillDetails(fillId)) as FillTableRow) || {};

  const detailItems = [
    {
      key: 'market',
      label: stringGetter({ key: STRING_KEYS.MARKET }),
      value: marketId,
    },
    {
      key: 'side',
      label: stringGetter({ key: STRING_KEYS.SIDE }),
      value: <OrderSideTag orderSide={orderSide} />,
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
      value: (
        <time>
          {DateTime.fromMillis(createdAtMilliseconds)
            .setLocale(selectedLocale as string)
            .toLocaleString(DateTime.DATETIME_SHORT)}
        </time>
      ),
    },
  ].filter((item) => Boolean(item.value)) as DetailsItem[];

  return (
    <DetailsDialog
      slotIcon={<Styled.AssetIcon symbol={asset.id} />}
      title={resources.typeStringKey && stringGetter({ key: resources.typeStringKey })}
      items={detailItems}
      setIsOpen={setIsOpen}
    />
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.AssetIcon = styled(AssetIcon)`
  font-size: 1em;
`;
