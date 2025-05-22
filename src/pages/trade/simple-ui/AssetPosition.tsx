import { useMemo, useState } from 'react';

import { BonsaiCore, BonsaiHelpers } from '@/bonsai/ontology';
import { orderBy } from 'lodash';

import { ButtonAction, ButtonShape, ButtonSize } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import {
  getPositionSideFromIndexerPositionSide,
  PositionSideTag,
} from '@/components/PositionSideTag';
import { VerticalSeparator } from '@/components/Separator';
import { Tag, TagType } from '@/components/Tag';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { MarketPositionCard } from './MarketPositionCard';
import { SimpleOrderCard } from './SimpleOrderCard';

export const AssetPosition = () => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const [tab, setTab] = useState<'position' | 'orders'>('position');
  const positions = useAppSelector(BonsaiCore.account.parentSubaccountPositions.data);
  const openOrders = useAppSelector(BonsaiHelpers.currentMarket.account.openOrders);
  const currentMarketId = useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)?.ticker;

  const position = useMemo(() => {
    return orderBy(
      positions?.filter((p) => p.market === currentMarketId),
      (p) => p.subaccountNumber,
      ['asc']
    ).at(0);
  }, [positions, currentMarketId]);

  const numOpenOrders = openOrders.length;

  return (
    <div tw="grid">
      <div tw="row h-full gap-1 font-medium-bold">
        <div tw="row gap-0.5">
          <button
            type="button"
            css={{
              color: tab === 'position' ? 'var(--color-text-2)' : 'var(--color-text-0)',
            }}
            onClick={() => setTab('position')}
          >
            <span tw="row gap-0.5">
              {stringGetter({ key: STRING_KEYS.POSITION })}

              {position ? (
                <PositionSideTag
                  positionSide={getPositionSideFromIndexerPositionSide(position.side)}
                />
              ) : (
                <Tag>{stringGetter({ key: STRING_KEYS.NONE })}</Tag>
              )}
            </span>
          </button>
        </div>

        <VerticalSeparator tw="flex h-full" fullHeight />

        <button
          type="button"
          css={{
            color: tab === 'orders' ? 'var(--color-text-2)' : 'var(--color-text-0)',
          }}
          onClick={() => setTab('orders')}
        >
          <span tw="row gap-0.5">
            {stringGetter({ key: STRING_KEYS.ORDERS })}
            {numOpenOrders > 0 && <Tag type={TagType.Number}>{numOpenOrders}</Tag>}
          </span>
        </button>
        {position?.side && (
          <Button
            tw="ml-auto [--button-backgroundColor:transparent]"
            action={ButtonAction.Reset}
            size={ButtonSize.Small}
            shape={ButtonShape.Pill}
            onClick={() =>
              dispatch(
                openDialog(
                  DialogTypes.SimpleUiTrade({
                    isClosingPosition: true,
                  })
                )
              )
            }
          >
            {stringGetter({ key: STRING_KEYS.CLOSE })}
          </Button>
        )}
      </div>

      {tab === 'position' && position && (
        <div tw="mt-1">
          <MarketPositionCard position={position} />
        </div>
      )}
      {tab === 'orders' && openOrders.length > 0 && (
        <div tw="flexColumn mt-1 gap-1">
          {openOrders.map((order) => (
            <SimpleOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
};
