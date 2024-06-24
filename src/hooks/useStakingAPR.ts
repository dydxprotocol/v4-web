import { useQuery } from '@tanstack/react-query';

import { useEndpointsConfig } from './useEndpointsConfig';

export const useStakingAPR = () => {
  const { stakingAPR: stakingAPREndpoint } = useEndpointsConfig();

  const queryFn = async () => {
    if (!stakingAPREndpoint) {
      return undefined;
    }
    const response = await fetch(stakingAPREndpoint, {
      headers: {
        'content-type': 'application/json',
      },
    });

    const data = await response.json();
    return data?.[0].rewardRate as number | undefined;
  };

  const { data } = useQuery({
    queryKey: ['stakingAPR'],
    queryFn,
    enabled: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return data;
};
