import { useEffect, useState } from 'react';

import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

// Styled component for the container
const Container = styled.div`
  display: flex;
  justify-content: flex-end;
  font-family: 'Inter', sans-serif;
`;

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
    }, 60000); // Update every 60 seconds

    return () => clearInterval(timer); // Cleanup the timer
  }, []);

  // Helper function to calculate "X mins ago"
  const getTimeDifference = (current: Date, lastUpdated: Date): string => {
    const diffInMs = current.getTime() - lastUpdated.getTime(); // Difference in milliseconds
    const diffInMinutes = Math.floor(diffInMs / 1000 / 60); // Convert to minutes

    if (diffInMinutes < 1) return stringGetter({ key: STRING_KEYS.JUST_NOW });
    if (diffInMinutes === 1) return stringGetter({ key: STRING_KEYS['1_MIN_AGO'] });
    if (diffInMinutes < 60)
      return stringGetter({
        key: STRING_KEYS.X_MINS_AGO,
        params: {
          X: diffInMinutes,
        },
      });

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return stringGetter({ key: STRING_KEYS['1_HOUR_AGO'] });
    if (diffInHours < 24)
      return stringGetter({
        key: STRING_KEYS.X_HOURS_AGO,
        params: {
          X: diffInHours,
        },
      });

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return stringGetter({ key: STRING_KEYS['1_DAY_AGO'] });
    return stringGetter({
      key: STRING_KEYS.X_DAYS_AGO,
      params: {
        X: diffInDays,
      },
    });
  };

  return (
    <Container>
      <span className="text-color-text-1">
        {stringGetter({ key: STRING_KEYS.UPDATED })}{' '}
        {getTimeDifference(currentTime, lastUpdatedDate)}
      </span>
    </Container>
  );
};

export default LastUpdated;
