import { TxStatusResponseJSON } from '@skip-router/core';

export const depositFromUsdcEthPending = {
  transfers: [
    {
      state: 'STATE_PENDING',
      transfer_sequence: [
        {
          cctp_transfer: {
            from_chain_id: '1',
            to_chain_id: 'noble-1',
            state: 'CCTP_TRANSFER_PENDING_CONFIRMATION',
            txs: {
              send_tx: {
                chain_id: '1',
                tx_hash: '0x092C0BFF67A71D483A3FCC5C0B390E4AA71E5C1CB9CFC1885989734A5975210D',
                explorer_link:
                  'https://etherscan.io/tx/0x092C0BFF67A71D483A3FCC5C0B390E4AA71E5C1CB9CFC1885989734A5975210D',
              },
              receive_tx: null,
            },
            src_chain_id: '1',
            dst_chain_id: 'noble-1',
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
        from_chain_id: '1',
        to_chain_id: 'noble-1',
        state: 'CCTP_TRANSFER_PENDING_CONFIRMATION',
        txs: {
          send_tx: {
            chain_id: '1',
            tx_hash: '0x092C0BFF67A71D483A3FCC5C0B390E4AA71E5C1CB9CFC1885989734A5975210D',
            explorer_link:
              'https://etherscan.io/tx/0x092C0BFF67A71D483A3FCC5C0B390E4AA71E5C1CB9CFC1885989734A5975210D',
          },
          receive_tx: null,
        },
        src_chain_id: '1',
        dst_chain_id: 'noble-1',
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

export const depositFromUsdcEthSuccess = {
  transfers: [
    {
      state: 'STATE_COMPLETED_SUCCESS',
      transfer_sequence: [
        {
          cctp_transfer: {
            from_chain_id: '1',
            to_chain_id: 'noble-1',
            state: 'CCTP_TRANSFER_RECEIVED',
            txs: {
              send_tx: {
                chain_id: '1',
                tx_hash: '0x092C0BFF67A71D483A3FCC5C0B390E4AA71E5C1CB9CFC1885989734A5975210D',
                explorer_link:
                  'https://etherscan.io/tx/0x092C0BFF67A71D483A3FCC5C0B390E4AA71E5C1CB9CFC1885989734A5975210D',
              },
              receive_tx: {
                chain_id: 'noble-1',
                tx_hash: 'A256406470B202AC2152EF195B50F01A2DB25C29A560DA6D89CE80662D338D12',
                explorer_link:
                  'https://www.mintscan.io/noble/txs/A256406470B202AC2152EF195B50F01A2DB25C29A560DA6D89CE80662D338D12',
              },
            },
            src_chain_id: '1',
            dst_chain_id: 'noble-1',
          },
        },
      ],
      next_blocking_transfer: null,
      transfer_asset_release: {
        chain_id: 'noble-1',
        denom: 'uusdc',
        released: true,
      },
      error: null,
    },
  ],
  state: 'STATE_COMPLETED_SUCCESS',
  transfer_sequence: [
    {
      cctp_transfer: {
        from_chain_id: '1',
        to_chain_id: 'noble-1',
        state: 'CCTP_TRANSFER_RECEIVED',
        txs: {
          send_tx: {
            chain_id: '1',
            tx_hash: '0x092C0BFF67A71D483A3FCC5C0B390E4AA71E5C1CB9CFC1885989734A5975210D',
            explorer_link:
              'https://etherscan.io/tx/0x092C0BFF67A71D483A3FCC5C0B390E4AA71E5C1CB9CFC1885989734A5975210D',
          },
          receive_tx: {
            chain_id: 'noble-1',
            tx_hash: 'A256406470B202AC2152EF195B50F01A2DB25C29A560DA6D89CE80662D338D12',
            explorer_link:
              'https://www.mintscan.io/noble/txs/A256406470B202AC2152EF195B50F01A2DB25C29A560DA6D89CE80662D338D12',
          },
        },
        src_chain_id: '1',
        dst_chain_id: 'noble-1',
      },
    },
  ],
  next_blocking_transfer: null,
  transfer_asset_release: {
    chain_id: 'noble-1',
    denom: 'uusdc',
    released: true,
  },
  error: null,
  status: 'STATE_COMPLETED',
} as TxStatusResponseJSON;
