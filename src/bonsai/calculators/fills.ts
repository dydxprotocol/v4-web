import { keyBy, maxBy, orderBy } from 'lodash';
import { weakMapMemoize } from 'reselect';

import { NUM_PARENT_SUBACCOUNTS } from '@/constants/account';
import { EMPTY_ARR } from '@/constants/objects';
import { IndexerFillType } from '@/types/indexer/indexerApiGen';
import { IndexerCompositeFillObject } from '@/types/indexer/indexerManual';

import { assertNever } from '@/lib/assertNever';
import { MustBigNumber } from '@/lib/numbers';

import { mergeObjects } from '../lib/mergeObjects';
import { SubaccountFill, SubaccountFillType } from '../types/summaryTypes';

export function calculateFills(
  liveFills: IndexerCompositeFillObject[] | undefined,
  restFills: IndexerCompositeFillObject[] | undefined
) {
  const getFillsById = (data: IndexerCompositeFillObject[]) => keyBy(data, (fill) => fill.id ?? '');
  const merged = mergeObjects(
    getFillsById(liveFills ?? EMPTY_ARR),
    getFillsById(restFills ?? EMPTY_ARR),
    (first, second) => maxBy([first, second], (f) => MustBigNumber(f.createdAtHeight).toNumber())!
  );
  return orderBy(Object.values(merged).map(calculateFill), [(f) => f.createdAt], ['desc']);
}

const calculateFill = weakMapMemoize(
  (base: IndexerCompositeFillObject): SubaccountFill => ({
    ...base,
    marginMode: (base.subaccountNumber ?? 0) >= NUM_PARENT_SUBACCOUNTS ? 'ISOLATED' : 'CROSS',
    type: getFillType(base),
  })
);

function getFillType({
  type,
  clientMetadata,
}: IndexerCompositeFillObject): SubaccountFillType | undefined {
  if (type == null) {
    return type;
  }
  if (type === IndexerFillType.LIQUIDATION) return SubaccountFillType.LIMIT; // CT-916
  if (type === IndexerFillType.DELEVERAGED) return SubaccountFillType.LIQUIDATED; // CT-1118
  if (type === IndexerFillType.OFFSETTING) return SubaccountFillType.DELEVERAGED; // CT-1118

  if (clientMetadata === '1' && type === IndexerFillType.LIMIT) return SubaccountFillType.MARKET;
  if (type === IndexerFillType.LIMIT) return SubaccountFillType.LIMIT;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (type === IndexerFillType.LIQUIDATED) return SubaccountFillType.LIQUIDATED;

  assertNever(type);
  return SubaccountFillType.LIMIT;
}
