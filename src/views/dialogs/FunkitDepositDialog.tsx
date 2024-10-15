import { useEffect } from 'react';

import { useFunkitBuyNobleUsdc } from '@/hooks/useFunkitBuyNobleUsdc';

export const FunkitDepositDialog = () => {
  const startCheckout = useFunkitBuyNobleUsdc();
  useEffect(() => {
    startCheckout();
  }, []);
  return null;
};
