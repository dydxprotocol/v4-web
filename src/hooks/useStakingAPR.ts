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
    queryKey: ['stakingAPY'],
    queryFn,
    enabled: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const formatedAPR = data ? (data * 100).toFixed(2) : undefined;

  return formatedAPR;
};
