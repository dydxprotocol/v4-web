import { useCallback } from 'react';

import { useQuery } from 'react-query';

// TODO: This api doesn't work due to cors, need to contact protocolstaking.info
export const useStakingAPY = () => {
  const queryFn = useCallback(async () => {
    const response = await fetch('https://api.protocolstaking.info/v0/protocols/dydx', {
      headers: {
        accept: 'application/json',
        'x-access-key': import.meta.env.VITE_PROTOCOL_STAKING_API_KEY,
      },
    });

    const data = await response.json();
    return data;
  }, []);

  const { data } = useQuery('stakingAPY', queryFn, {
    enabled: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return data;
};
