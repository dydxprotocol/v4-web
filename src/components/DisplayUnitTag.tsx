import { useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { DisplayUnit } from '@/constants/trade';

import { useAppSelector } from '@/state/appTypes';
import { setDisplayUnit } from '@/state/configs';
import { getSelectedDisplayUnit } from '@/state/configsSelectors';

import { Tag } from './Tag';

type ElementProps = {
  assetId?: string;
  className?: string;
  entryPoint: string;
};

export const DisplayUnitTag = ({ entryPoint, assetId, className }: ElementProps) => {
  const displayUnit = useAppSelector(getSelectedDisplayUnit);
  const dispatch = useDispatch();

  const onToggle = useCallback(() => {
    if (!assetId) return;

    const newDisplayUnit = displayUnit === DisplayUnit.Asset ? DisplayUnit.Fiat : DisplayUnit.Asset;
    dispatch(
      setDisplayUnit({
        newDisplayUnit,
        assetId,
        entryPoint,
      })
    );
  }, [assetId, dispatch, displayUnit, entryPoint]);

  return !assetId ? (
    <Tag className={className}>USD</Tag>
  ) : (
    <Tag onClick={onToggle} tw="cursor-pointer" className={className}>
      {
        {
          [DisplayUnit.Asset]: assetId,
          [DisplayUnit.Fiat]: 'USD',
        }[displayUnit]
      }
    </Tag>
  );
};
