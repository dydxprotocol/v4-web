import { shallowEqual, useSelector } from 'react-redux';

import type { AbacusApiState, Nullable } from '@/constants/abacus';
import { AbacusApiStatus } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

import { getApiState } from '@/state/appSelectors';
import { useStringGetter } from './useStringGetter';
import { StringGetterFunction } from '@/constants/localization';

const getStatusErrorMessage = ({
  apiState,
  stringGetter,
}: {
  apiState: Nullable<AbacusApiState>;
  stringGetter: StringGetterFunction;
}) => {
  const { haltedBlock, trailingBlocks, status } = apiState || {};

  switch (status) {
    case AbacusApiStatus.INDEXER_DOWN: {
      return stringGetter({ key: STRING_KEYS.INDEXER_DOWN });
    }
    case AbacusApiStatus.INDEXER_HALTED: {
      return stringGetter({
        key: STRING_KEYS.INDEXER_HALTED,
        params: { BLOCK_NUMBER: haltedBlock },
      });
    }
    case AbacusApiStatus.INDEXER_TRAILING: {
      return stringGetter({
        key: STRING_KEYS.INDEXER_TRAILING,
        params: { BLOCK_DIFFERENCE: trailingBlocks },
      });
    }
    case AbacusApiStatus.VALIDATOR_DOWN: {
      return stringGetter({ key: STRING_KEYS.NODE_DOWN });
    }
    case AbacusApiStatus.VALIDATOR_HALTED: {
      return stringGetter({ key: STRING_KEYS.NODE_HALTED, params: { BLOCK_NUMBER: haltedBlock } });
    }
    case AbacusApiStatus.UNKNOWN: {
      return stringGetter({ key: STRING_KEYS.UNKNOWN_API_ERROR });
    }
    case AbacusApiStatus.NORMAL:
    default: {
      return null;
    }
  }
};

export const getIndexerHeight = (apiState: Nullable<AbacusApiState>) => {
  const { haltedBlock, trailingBlocks, status, height } = apiState || {};

  switch (status) {
    case AbacusApiStatus.INDEXER_HALTED: {
      return haltedBlock;
    }
    case AbacusApiStatus.INDEXER_TRAILING: {
      return height != null && trailingBlocks != null ? height - trailingBlocks : null;
    }
    default: {
      return height;
    }
  }
};

export const useApiState = () => {
  const stringGetter = useStringGetter();
  const apiState = useSelector(getApiState, shallowEqual);
  const { haltedBlock, height, status, trailingBlocks } = apiState ?? {};
  const statusErrorMessage = getStatusErrorMessage({ apiState, stringGetter });
  const indexerHeight = getIndexerHeight(apiState);

  return {
    haltedBlock,
    height,
    indexerHeight,
    status,
    statusErrorMessage,
    trailingBlocks,
  };
};
