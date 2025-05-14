import { useState } from 'react';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { VerticalSeparator } from '@/components/Separator';
import { Tag } from '@/components/Tag';

export const AssetPosition = () => {
  const stringGetter = useStringGetter();
  const [tab, setTab] = useState<'position' | 'orders'>('position');
  // const position = useAppSelector(BonsaiCore.account.parentSubaccountPositions.data);
  // const orders = useAppSelector(BonsaiHelpers.currentMarket.account.openOrders);

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
            <span>{stringGetter({ key: STRING_KEYS.POSITION })}</span>
          </button>
          <VerticalSeparator tw="flex h-full" fullHeight />
          <Tag>{stringGetter({ key: STRING_KEYS.NONE })}</Tag>
        </div>

        <VerticalSeparator tw="flex h-full" fullHeight />

        <button
          type="button"
          css={{
            color: tab === 'orders' ? 'var(--color-text-2)' : 'var(--color-text-0)',
          }}
          onClick={() => setTab('orders')}
        >
          <span>{stringGetter({ key: STRING_KEYS.ORDERS })}</span>
        </button>
      </div>
    </div>
  );
};
