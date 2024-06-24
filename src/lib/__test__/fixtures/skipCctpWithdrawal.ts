import { TxStatusResponseJSON } from '@skip-router/core';

export const withdrawToUsdcEthPending = {
  transfers: [
    {
      state: 'STATE_PENDING',
      transfer_sequence: [
        {
          cctp_transfer: {
            from_chain_id: 'noble-1',
            to_chain_id: '1',
            state: 'CCTP_TRANSFER_SENT',
            txs: {
              send_tx: {
                chain_id: 'noble-1',
                tx_hash: 'E550035D05238AA83BC025240B7CD1370D5516BB2D06BCDB31FA7DB229AA1E25',
                explorer_link:
                  'https://www.mintscan.io/noble/txs/E550035D05238AA83BC025240B7CD1370D5516BB2D06BCDB31FA7DB229AA1E25',
              },
              receive_tx: null,
            },
            src_chain_id: 'noble-1',
            dst_chain_id: '1',
          },
        },
      ],
      next_blocking_transfer: {
        transfer_sequence_index: 0,
      },
      transfer_asset_release: null,
      error: null,
    },
  ],
  state: 'STATE_PENDING',
  transfer_sequence: [
    {
      cctp_transfer: {
        from_chain_id: 'noble-1',
        to_chain_id: '1',
        state: 'CCTP_TRANSFER_SENT',
        txs: {
          send_tx: {
            chain_id: 'noble-1',
            tx_hash: 'E550035D05238AA83BC025240B7CD1370D5516BB2D06BCDB31FA7DB229AA1E25',
            explorer_link:
              'https://www.mintscan.io/noble/txs/E550035D05238AA83BC025240B7CD1370D5516BB2D06BCDB31FA7DB229AA1E25',
          },
          receive_tx: null,
        },
        src_chain_id: 'noble-1',
        dst_chain_id: '1',
      },
    },
  ],
  next_blocking_transfer: {
    transfer_sequence_index: 0,
  },
  transfer_asset_release: null,
  error: null,
  status: 'STATE_PENDING',
} as TxStatusResponseJSON;

export const withdrawToUsdcEthSuccess = {
  transfers: [
    {
      state: 'STATE_COMPLETED_SUCCESS',
      transfer_sequence: [
        {
          cctp_transfer: {
            from_chain_id: 'noble-1',
            to_chain_id: '1',
            state: 'CCTP_TRANSFER_RECEIVED',
            txs: {
              send_tx: {
                chain_id: 'noble-1',
                tx_hash: 'E550035D05238AA83BC025240B7CD1370D5516BB2D06BCDB31FA7DB229AA1E25',
                explorer_link:
                  'https://www.mintscan.io/noble/txs/E550035D05238AA83BC025240B7CD1370D5516BB2D06BCDB31FA7DB229AA1E25',
              },
              receive_tx: {
                chain_id: '1',
                tx_hash: '0x969f344e567146442b28a30c52111937a703c1360db26e48ed57786630addd37',
                explorer_link:
                  'https://etherscan.io/tx/0x969f344e567146442b28a30c52111937a703c1360db26e48ed57786630addd37',
              },
            },
            src_chain_id: 'noble-1',
            dst_chain_id: '1',
          },
        },
      ],
      next_blocking_transfer: null,
      transfer_asset_release: {
        chain_id: '1',
        denom: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        released: true,
      },
      error: null,
    },
  ],
  state: 'STATE_COMPLETED_SUCCESS',
  transfer_sequence: [
    {
      cctp_transfer: {
        from_chain_id: 'noble-1',
        to_chain_id: '1',
        state: 'CCTP_TRANSFER_RECEIVED',
        txs: {
          send_tx: {
            chain_id: 'noble-1',
            tx_hash: 'E550035D05238AA83BC025240B7CD1370D5516BB2D06BCDB31FA7DB229AA1E25',
            explorer_link:
              'https://www.mintscan.io/noble/txs/E550035D05238AA83BC025240B7CD1370D5516BB2D06BCDB31FA7DB229AA1E25',
          },
          receive_tx: {
            chain_id: '1',
            tx_hash: '0x969f344e567146442b28a30c52111937a703c1360db26e48ed57786630addd37',
            explorer_link:
              'https://etherscan.io/tx/0x969f344e567146442b28a30c52111937a703c1360db26e48ed57786630addd37',
          },
        },
        src_chain_id: 'noble-1',
        dst_chain_id: '1',
      },
    },
  ],
  next_blocking_transfer: null,
  transfer_asset_release: {
    chain_id: '1',
    denom: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    released: true,
  },
  error: null,
  status: 'STATE_COMPLETED',
} as TxStatusResponseJSON;
