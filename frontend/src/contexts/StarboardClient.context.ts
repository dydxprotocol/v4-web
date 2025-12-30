import { createContext } from 'react';
import { type StarboardClient } from 'fuel-ts-sdk/client';

export const StarboardClientContext = createContext<StarboardClient | null>(null);
