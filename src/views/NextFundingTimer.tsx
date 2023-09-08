import { useState, useCallback } from 'react';
import { useInterval } from '@/hooks';

import { getTimeTillNextUnit, formatSeconds } from '@/lib/timeUtils';
import { Output, OutputType } from '@/components/Output';

export const NextFundingTimer = () => {
  const [secondsLeft, setSecondsLeft] = useState<number | undefined>();

  const updateSecondsLeft = useCallback(() => {
    setSecondsLeft(getTimeTillNextUnit('hour'));
  }, []);

  useInterval({ callback: updateSecondsLeft });

  return (
    <Output
      type={OutputType.Text}
      value={
        secondsLeft !== undefined
          ? formatSeconds(secondsLeft)
          : undefined
      }
    />
  );
};
