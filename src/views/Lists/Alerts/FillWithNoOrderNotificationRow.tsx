import { SubaccountFill } from '@/bonsai/types/summaryTypes';

import { TradeRow } from '../Trade/TradeRow';
import { UnseenIndicator } from './UnseenIndicator';

export const FillWithNoOrderNotificationRow = ({
  className,
  fill,
  timestamp,
  isUnseen,
}: {
  className?: string;
  fill: SubaccountFill;
  timestamp: number;
  isUnseen: boolean;
}) => {
  return (
    <TradeRow
      className={className}
      fill={fill}
      timestamp={timestamp}
      slotRight={isUnseen ? <UnseenIndicator /> : null}
    />
  );
};
