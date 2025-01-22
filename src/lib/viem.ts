import { createPublicClient, http } from 'viem';
import { arbitrum, base, mainnet, optimism, polygon } from 'viem/chains';

import { ChainId, getAlchemyRPCUrlForChainId } from './wagmi';

export const VIEM_PUBLIC_CLIENTS = {
  [mainnet.id]: createPublicClient({
    chain: mainnet,
    transport: http(getAlchemyRPCUrlForChainId(ChainId.ETH_MAINNET)),
  }),
  [base.id]: createPublicClient({
    chain: base,
    transport: http(getAlchemyRPCUrlForChainId(ChainId.BASE_MAINNET)),
  }),
  [arbitrum.id]: createPublicClient({
    chain: arbitrum,
    transport: http(getAlchemyRPCUrlForChainId(ChainId.ARB_MAINNET)),
  }),
  [optimism.id]: createPublicClient({
    chain: optimism,
    transport: http(getAlchemyRPCUrlForChainId(ChainId.OPT_MAINNET)),
  }),
  [polygon.id]: createPublicClient({
    chain: polygon,
    transport: http(getAlchemyRPCUrlForChainId(ChainId.POLYGON_MAINNET)),
  }),
} as const;
