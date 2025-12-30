import type { StarboardClient } from "fuel-ts-sdk/client";
import { createContext } from "react";

export type FuelTsSdkContextType = StarboardClient
export const FuelTsSdkContext = createContext<FuelTsSdkContextType | null>(null);

