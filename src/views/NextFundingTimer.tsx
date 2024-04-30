import { useCallback, useState } from 'react';

import { useInterval } from '@/hooks';

import { Output, OutputType } from '@/components/Output';

import { formatSeconds, getTimeTillNextUnit } from '@/lib/timeUtils';

export const NextFundingTimer = () => {
  const [secondsLeft, setSecondsLeft] = useState<number | undefined>();

  const updateSecondsLeft = useCallback(() => {
    setSecondsLeft(getTimeTillNextUnit('hour'));
  }, []);

  useInterval({ callback: updateSecondsLeft });

  return (
    <Output
      type={OutputType.Text}
      value={secondsLeft !== undefined ? formatSeconds(secondsLeft) : undefined}
    />
  );
};
