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
      const accountOwner = new PublicKey(address);
      const tokenMint = new PublicKey(token);
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(accountOwner, {
        mint: tokenMint,
      });
      return {
        data: {
          formatted: tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount,
          amount: tokenAccounts.value[0].account.data.parsed.info.tokenAmount.amount,
          decimals: tokenAccounts.value[0].account.data.parsed.info.tokenAmount.decimals,
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
