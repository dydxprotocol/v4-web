import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Panel } from '@/components/Panel';

export const GeoblockedPanel = () => {
  const stringGetter = useStringGetter();

  return <Panel>{stringGetter({ key: STRING_KEYS.TRADING_REWARDS_UNAVAILABLE_IN_US })}</Panel>;
};
