import { useQuery } from '@tanstack/react-query';

import { PERCENT_DECIMALS } from '@/constants/numbers';

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

  const formattedAPR = data ? (data * 100).toFixed(PERCENT_DECIMALS) : undefined;

  return formattedAPR;
};
