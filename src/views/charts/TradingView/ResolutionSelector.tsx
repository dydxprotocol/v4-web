import { useCallback } from 'react';

import { ResolutionString } from 'public/tradingview/charting_library';

import {
  LAUNCHABLE_MARKET_RESOLUTION_CONFIGS,
  RESOLUTION_MAP,
  RESOLUTION_STRING_TO_LABEL,
} from '@/constants/candles';

import { useStringGetter } from '@/hooks/useStringGetter';

import { objectKeys } from '@/lib/objectHelpers';

export const ResolutionSelector = ({
  isLaunchable,
  onResolutionChange,
  currentResolution,
}: {
  isLaunchable?: boolean;
  onResolutionChange: (resolution: ResolutionString) => void;
  currentResolution?: ResolutionString;
}) => {
  const stringGetter = useStringGetter();

  const getLabel = useCallback(
    (resolution: ResolutionString) => {
      const resolutionLabelInfo = RESOLUTION_STRING_TO_LABEL[resolution];
      if (resolutionLabelInfo == null) return undefined;

      if (resolutionLabelInfo.unitStringKey) {
        return `${resolutionLabelInfo.value}${stringGetter({ key: resolutionLabelInfo.unitStringKey })}`;
      }

      return resolutionLabelInfo.value;
    },
    [stringGetter]
  );

  return (
    <div tw="row justify-evenly gap-0.5">
      {objectKeys(isLaunchable ? LAUNCHABLE_MARKET_RESOLUTION_CONFIGS : RESOLUTION_MAP).map(
        (resolution) => (
          <button
            tw="size-2.75 max-w-2.75 flex-1 border-b-0 border-l-0 border-r-0 border-t-2 border-solid border-color-accent"
            type="button"
            css={{
              borderColor: currentResolution !== resolution ? 'transparent' : 'var(--color-accent)',
            }}
            key={resolution}
            onClick={() => onResolutionChange(resolution)}
          >
            {getLabel(resolution)}
          </button>
        )
      )}
    </div>
  );
};
