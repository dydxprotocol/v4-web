import { createContext } from 'react';
import { type StarboardClient } from 'fuel-ts-sdk';

export const StarboardClientContext = createContext<StarboardClient | null>(null);
