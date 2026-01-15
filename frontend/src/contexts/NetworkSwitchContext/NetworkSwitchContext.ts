import { createContext } from 'react';
import type { Network } from '@/models/Network';

export interface NetworkSwitchContextType {
  getCurrentNetwork: () => Network;
  changeNetwork: (targetNetwork: Network) => void;
}

export const NetworkSwitchContext = createContext<NetworkSwitchContextType | null>(null);
