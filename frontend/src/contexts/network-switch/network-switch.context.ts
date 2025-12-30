import { createContext } from 'react';

export interface NetworkSwitchContextType {
  getNetworkUrl: () => string;
  changeNetworkUrl: (url: string) => void;
}

export const NetworkSwitchContext = createContext<NetworkSwitchContextType | null>(null);
