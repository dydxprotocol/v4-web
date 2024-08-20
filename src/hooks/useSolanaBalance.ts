import { PublicKey } from '@solana/web3.js';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import { useSolanaConnection } from '@/hooks/useSolanaConnection';

type BalanceProps = {
  address: string | undefined;
  token: string | undefined;
  query?: Pick<UseQueryOptions, 'enabled'>;
};

export const useSolanaTokenBalance = ({ address, token }: BalanceProps) => {
  const connection = useSolanaConnection();

  const queryFn = async () => {
    try {
      if (!address || !token) {
        throw new Error('Account or token address is not present');
      }
      const owner = new PublicKey(address);
      const mint = new PublicKey(token);
      const response = await connection.getParsedTokenAccountsByOwner(owner, { mint });

      // An array of all of the owner's associated token accounts for the `mint`.
      const accounts = response.value;

      // The owner has no associated token accounts open for the
      // specified token mint, and therefore, their balance is zero.
      if (accounts.length === 0)
        return {
          data: {
            formatted: 0,
            amount: 0,
            decimals: 0,
          },
        };

      // Select the associated token account owned by the user with the highest amount
      const largestAccount = accounts.reduce((largest, current) => {
        const currentBalance = current.account.data.parsed.info.tokenAmount.uiAmount;
        const largestBalance = largest.account.data.parsed.info.tokenAmount.uiAmount;
        return currentBalance >= largestBalance ? current : largest;
      }, accounts[0]);

      return {
        data: {
          formatted: largestAccount.account.data.parsed.info.tokenAmount.uiAmount,
          amount: largestAccount.account.data.parsed.info.tokenAmount.amount,
          decimals: largestAccount.account.data.parsed.info.tokenAmount.decimals,
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch Solana balance: ${error.message}`);
    }
  };

  return useQuery({
    queryKey: ['solanaTokenBalance', address, token],
    staleTime: 0,
    gcTime: 0,
    queryFn,
    enabled: !!(address && token),
    retryOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};
