import { useEffect, useState } from 'react';

import { STRING_KEYS } from '@/constants/localization';
import { timeUnits } from '@/constants/time';

import { useStringGetter } from '@/hooks/useStringGetter';

const LAST_UPDATED_REFRESH_MS = timeUnits.minute;

interface IProps {
  lastUpdatedDate: Date;
}

const LastUpdated = ({ lastUpdatedDate }: IProps) => {
  const stringGetter = useStringGetter();

  // State to hold the current time
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Update the current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, LAST_UPDATED_REFRESH_MS); // Update every 60 seconds

    return () => clearInterval(timer); // Cleanup the timer
  }, []);

  function timeAgo(currentDate: Date, timestamp: Date): string {
    const diffInSeconds = Math.floor((currentDate.getTime() - timestamp.getTime()) / 1000);

    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

    if (diffInSeconds < 60) {
      // TODO(affiliates): Localize this
      return 'just now';
    }

    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return rtf.format(-minutes, 'minute');
    }

    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);

      return rtf.format(-hours, 'hour');
    }

    const days = Math.floor(diffInSeconds / 86400);

    return rtf.format(-days, 'day');
  }

  return (
    <span className="self-end text-mini text-color-text-1">
      {stringGetter({ key: STRING_KEYS.UPDATED })} {timeAgo(currentTime, lastUpdatedDate)}
    </span>
  );
};

export default LastUpdated;
