import { createContext } from 'react';
import type { StarboardClient } from 'fuel-ts-sdk/client';

export type FuelTsSdkContextType = StarboardClient;
export const FuelTsSdkContext = createContext<FuelTsSdkContextType | null>(null);
