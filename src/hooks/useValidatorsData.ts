import { Network, ValidatorClient } from '@dydxprotocol/v4-client-js';
import { useQuery } from 'react-query';

export const useValidatorsData = () => {
  const { data } = useQuery({
    queryKey: ['validators', 'all'],
    queryFn: async () => {
      const client = await ValidatorClient.connect(Network.testnet().validatorConfig);
      return client.get.getAllValidators();
    },
    // refetchInterval: () => 10000,
  });
  return { validatorsData: data };
};
