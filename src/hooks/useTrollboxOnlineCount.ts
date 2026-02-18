import { useQuery } from '@tanstack/react-query';

const POLLING_INTERVAL = 15_000;
const TROLLBOX_URL = import.meta.env.VITE_TROLLBOX_URL;
const CONNECTED_ADDRESSES_URL = `${TROLLBOX_URL}/connected-addresses`;

export const useTrollboxOnlineCount = () => {
  const { data } = useQuery({
    queryKey: ['trollboxConnectedAddresses'],
    queryFn: async (): Promise<number> => {
      const response = await fetch(CONNECTED_ADDRESSES_URL);
      if (!response.ok) throw new Error('Failed to fetch connected addresses');
      const json = await response.json();
      return json.count;
    },
    refetchInterval: POLLING_INTERVAL,
  });

  return data;
};
