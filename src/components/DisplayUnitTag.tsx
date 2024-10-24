import { useCallback } from 'react';

import { debounce } from 'lodash';
import { useDispatch } from 'react-redux';

import { NORMAL_DEBOUNCE_MS } from '@/constants/debounce';
import { DisplayUnit } from '@/constants/trade';

import { useAppSelector } from '@/state/appTypes';
import { setDisplayUnit } from '@/state/appUiConfigs';
import { getSelectedDisplayUnit } from '@/state/appUiConfigsSelectors';

import { getDisplayableAssetFromBaseAsset } from '@/lib/assetUtils';

import { Tag } from './Tag';

type ElementProps = {
  assetId?: string;
  className?: string;
  entryPoint: string;
};

export const DisplayUnitTag = ({ entryPoint, assetId, className }: ElementProps) => {
  const displayUnit = useAppSelector(getSelectedDisplayUnit);
  const dispatch = useDispatch();

  const dispatchSetDisplayUnit = debounce((newDisplayUnit) => {
    if (!assetId) return;
    dispatch(setDisplayUnit({ newDisplayUnit, entryPoint, assetId }));
  }, NORMAL_DEBOUNCE_MS);

  const onToggle = useCallback(() => {
    if (!assetId) return;

    const newDisplayUnit = displayUnit === DisplayUnit.Asset ? DisplayUnit.Fiat : DisplayUnit.Asset;
    dispatchSetDisplayUnit(newDisplayUnit);
  }, [assetId, dispatchSetDisplayUnit, displayUnit]);

  return !assetId ? (
    <Tag className={className}>USD</Tag>
  ) : (
    <Tag onClick={onToggle} tw="cursor-pointer" className={className}>
      {
        {
          [DisplayUnit.Asset]: getDisplayableAssetFromBaseAsset(assetId),
          [DisplayUnit.Fiat]: 'USD',
        }[displayUnit]
      }
    </Tag>
  );
};
