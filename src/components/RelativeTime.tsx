import { useEffect, useState } from 'react';

import { useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { formatRelativeTime } from '@/lib/dateTime';

export const RelativeTime = ({
  timestamp,
  format,
  resolution = 2,
}: {
  timestamp?: number;
  format: 'long' | 'short' | 'narrow' | 'singleCharacter';
  resolution?: number;
}) => {
  const locale = useAppSelector(getSelectedLocale);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(i);
  }, []);

  return timestamp && new Date(timestamp).valueOf() ? (
    <time
      dateTime={new Date(timestamp).toISOString()}
      title={new Date(timestamp).toLocaleString(locale)}
    >
      {formatRelativeTime(new Date(timestamp).valueOf(), { locale, format, resolution })}
    </time>
  ) : null;
};
