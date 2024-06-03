import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { AppRoute, BASE_ROUTE } from '@/constants/routes';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Link } from '@/components/Link';
import { Panel } from '@/components/Panel';

export const GeoblockedPanel = () => {
  const stringGetter = useStringGetter();

  return (
    <Panel>
      {stringGetter({
        key: STRING_KEYS.TRADING_REWARDS_UNAVAILABLE_IN_US,
        params: {
          TERMS_OF_USE_LINK: (
            <$Link href={`${BASE_ROUTE}${AppRoute.Terms}`}>
              {stringGetter({ key: STRING_KEYS.TERMS_OF_USE })}
            </$Link>
          ),
        },
      })}
    </Panel>
  );
};

const $Link = styled(Link)`
  --link-color: var(--color-text-1);
  
  display: inline-block;
  text-decoration: underline;
`;
