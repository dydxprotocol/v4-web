import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Panel } from '@/components/Panel';
import { TermsOfUseLink } from '@/components/TermsOfUseLink';

export const GeoblockedPanel = () => {
  const stringGetter = useStringGetter();

  return (
    <Panel>
      {stringGetter({
        key: STRING_KEYS.TRADING_REWARDS_UNAVAILABLE_IN_US,
        params: {
          TERMS_OF_USE_LINK: <TermsOfUseLink isInline />,
        },
      })}
    </Panel>
  );
};
