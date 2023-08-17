import { type MenuItem } from '@/constants/menus';
import { type DydxNetwork, DydxV3Network, DydxV4Network } from '@/constants/networks';

export const useNetworks = (): MenuItem<DydxNetwork>[] =>
  import.meta.env.MODE === 'production'
    ? [
        {
          value: DydxV4Network.V4Testnet2,
          label: 'Testnet',
          slotBefore: <b>v4</b>,
        },
      ]
    : [
        {
          value: DydxV4Network.V4Mainnet,
          label: 'Mainnet',
          slotBefore: <b>v4</b>,
          disabled: true,
        },
        {
          value: DydxV4Network.V4Staging,
          label: 'Staging',
          slotBefore: <b>v4</b>,
        },
        {
          value: DydxV4Network.V4Testnet2,
          label: 'Testnet-2',
          slotBefore: <b>v4</b>,
        },
        {
          value: DydxV4Network.V4Local,
          label: 'Dev',
          slotBefore: <b>v4</b>,
        },
        {
          value: DydxV3Network.V3Mainnet,
          label: 'Mainnet',
          slotBefore: <b>v3</b>,
        },
        {
          value: DydxV3Network.V3Testnet,
          label: 'Testnet',
          slotBefore: <b>v3</b>,
        },
      ];
