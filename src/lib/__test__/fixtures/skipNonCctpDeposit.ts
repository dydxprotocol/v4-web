import { TxStatusResponseJSON } from '@skip-router/core';

export const depositFromEthereumEthSubmitted = {
  transfers: [
    {
      state: 'STATE_SUBMITTED',
      transfer_sequence: [],
      next_blocking_transfer: null,
      transfer_asset_release: null,
      error: null,
    },
  ],
  state: 'STATE_SUBMITTED',
  transfer_sequence: [],
  next_blocking_transfer: null,
  transfer_asset_release: null,
  error: null,
  status: 'STATE_SUBMITTED',
} as TxStatusResponseJSON;

export const depositFromEthereumEthPending = {
  transfers: [
    {
      state: 'STATE_PENDING',
      transfer_sequence: [
        {
          axelar_transfer: {
            from_chain_id: '1',
            to_chain_id: 'osmosis-1',
            type: 'AXELAR_TRANSFER_CONTRACT_CALL_WITH_TOKEN',
            state: 'AXELAR_TRANSFER_PENDING_CONFIRMATION',
            txs: {
              contract_call_with_token_txs: {
                send_tx: {
                  chain_id: '1',
                  tx_hash: '0x6792ba9fa4d1a0316ffabad1541dc4c5ddcd8c4bb38b9a1368f08931f9c14e1c',
                  explorer_link:
                    'https://etherscan.io/tx/0x6792ba9fa4d1a0316ffabad1541dc4c5ddcd8c4bb38b9a1368f08931f9c14e1c',
                },
                gas_paid_tx: {
                  chain_id: '1',
                  tx_hash: '0x6792ba9fa4d1a0316ffabad1541dc4c5ddcd8c4bb38b9a1368f08931f9c14e1c',
                  explorer_link:
                    'https://etherscan.io/tx/0x6792ba9fa4d1a0316ffabad1541dc4c5ddcd8c4bb38b9a1368f08931f9c14e1c',
                },
                confirm_tx: null,
                approve_tx: null,
                execute_tx: null,
                error: null,
              },
            },
            axelar_scan_link:
              'https://axelarscan.io/gmp/0x6792ba9fa4d1a0316ffabad1541dc4c5ddcd8c4bb38b9a1368f08931f9c14e1c',
            src_chain_id: '1',
            dst_chain_id: 'osmosis-1',
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
      axelar_transfer: {
        from_chain_id: '1',
        to_chain_id: 'osmosis-1',
        type: 'AXELAR_TRANSFER_CONTRACT_CALL_WITH_TOKEN',
        state: 'AXELAR_TRANSFER_PENDING_CONFIRMATION',
        txs: {
          contract_call_with_token_txs: {
            send_tx: {
              chain_id: '1',
              tx_hash: '0x6792ba9fa4d1a0316ffabad1541dc4c5ddcd8c4bb38b9a1368f08931f9c14e1c',
              explorer_link:
                'https://etherscan.io/tx/0x6792ba9fa4d1a0316ffabad1541dc4c5ddcd8c4bb38b9a1368f08931f9c14e1c',
            },
            gas_paid_tx: {
              chain_id: '1',
              tx_hash: '0x6792ba9fa4d1a0316ffabad1541dc4c5ddcd8c4bb38b9a1368f08931f9c14e1c',
              explorer_link:
                'https://etherscan.io/tx/0x6792ba9fa4d1a0316ffabad1541dc4c5ddcd8c4bb38b9a1368f08931f9c14e1c',
            },
            confirm_tx: null,
            approve_tx: null,
            execute_tx: null,
            error: null,
          },
        },
        axelar_scan_link:
          'https://axelarscan.io/gmp/0x6792ba9fa4d1a0316ffabad1541dc4c5ddcd8c4bb38b9a1368f08931f9c14e1c',
        src_chain_id: '1',
        dst_chain_id: 'osmosis-1',
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

export const depositFromEthereumEthSuccess = {
  transfers: [
    {
      state: 'STATE_COMPLETED_SUCCESS',
      transfer_sequence: [
        {
          axelar_transfer: {
            from_chain_id: '1',
            to_chain_id: 'osmosis-1',
            type: 'AXELAR_TRANSFER_CONTRACT_CALL_WITH_TOKEN',
            state: 'AXELAR_TRANSFER_SUCCESS',
            txs: {
              contract_call_with_token_txs: {
                send_tx: {
                  chain_id: '1',
                  tx_hash: '0x6792ba9fa4d1a0316ffabad1541dc4c5ddcd8c4bb38b9a1368f08931f9c14e1c',
                  explorer_link:
                    'https://etherscan.io/tx/0x6792ba9fa4d1a0316ffabad1541dc4c5ddcd8c4bb38b9a1368f08931f9c14e1c',
                },
                gas_paid_tx: {
                  chain_id: '1',
                  tx_hash: '0x6792ba9fa4d1a0316ffabad1541dc4c5ddcd8c4bb38b9a1368f08931f9c14e1c',
                  explorer_link:
                    'https://etherscan.io/tx/0x6792ba9fa4d1a0316ffabad1541dc4c5ddcd8c4bb38b9a1368f08931f9c14e1c',
                },
                confirm_tx: {
                  chain_id: 'axelar-dojo-1',
                  tx_hash: '282FEBD83D4D67558D40D94D2B1F212738CC293E7426123D3A415E134E41C0E0',
                  explorer_link:
                    'https://mintscan.io/axelar/tx/282FEBD83D4D67558D40D94D2B1F212738CC293E7426123D3A415E134E41C0E0',
                },
                approve_tx: null,
                execute_tx: {
                  chain_id: 'osmosis-1',
                  tx_hash: '2ED2F33533EBE597EEA656F7822F2CE585240544BC3E78F6945E6446997740F0',
                  explorer_link:
                    'https://www.mintscan.io/osmosis/transactions/2ED2F33533EBE597EEA656F7822F2CE585240544BC3E78F6945E6446997740F0',
                },
                error: null,
              },
            },
            axelar_scan_link:
              'https://axelarscan.io/gmp/0x6792ba9fa4d1a0316ffabad1541dc4c5ddcd8c4bb38b9a1368f08931f9c14e1c',
            src_chain_id: '1',
            dst_chain_id: 'osmosis-1',
          },
        },
        {
          ibc_transfer: {
            from_chain_id: 'osmosis-1',
            to_chain_id: 'noble-1',
            state: 'TRANSFER_SUCCESS',
            packet_txs: {
              send_tx: {
                chain_id: 'osmosis-1',
                tx_hash: '2ED2F33533EBE597EEA656F7822F2CE585240544BC3E78F6945E6446997740F0',
                explorer_link:
                  'https://www.mintscan.io/osmosis/transactions/2ED2F33533EBE597EEA656F7822F2CE585240544BC3E78F6945E6446997740F0',
              },
              receive_tx: {
                chain_id: 'noble-1',
                tx_hash: 'D8E14E9BD6E1FB14BC1451E4F973A070E35257FF7D392D9F499BAD0CA9ECAFD4',
                explorer_link:
                  'https://www.mintscan.io/noble/txs/D8E14E9BD6E1FB14BC1451E4F973A070E35257FF7D392D9F499BAD0CA9ECAFD4',
              },
              acknowledge_tx: {
                chain_id: 'osmosis-1',
                tx_hash: 'D6EB805D774E89F81FBBBAF4DDE5FE22EF5237B89AD8178080C024237443783E',
                explorer_link:
                  'https://www.mintscan.io/osmosis/transactions/D6EB805D774E89F81FBBBAF4DDE5FE22EF5237B89AD8178080C024237443783E',
              },
              timeout_tx: null,
              error: null,
            },
            src_chain_id: 'osmosis-1',
            dst_chain_id: 'noble-1',
          },
        },
        {
          ibc_transfer: {
            from_chain_id: 'noble-1',
            to_chain_id: 'dydx-mainnet-1',
            state: 'TRANSFER_SUCCESS',
            packet_txs: {
              send_tx: {
                chain_id: 'noble-1',
                tx_hash: 'D8E14E9BD6E1FB14BC1451E4F973A070E35257FF7D392D9F499BAD0CA9ECAFD4',
                explorer_link:
                  'https://www.mintscan.io/noble/txs/D8E14E9BD6E1FB14BC1451E4F973A070E35257FF7D392D9F499BAD0CA9ECAFD4',
              },
              receive_tx: {
                chain_id: 'dydx-mainnet-1',
                tx_hash: '1AA3F46507A9E0A1D183625BA5C65D6A9AAC546E346382A33D3D15F064349579',
                explorer_link:
                  'https://www.mintscan.io/dydx/txs/1AA3F46507A9E0A1D183625BA5C65D6A9AAC546E346382A33D3D15F064349579',
              },
              acknowledge_tx: {
                chain_id: 'noble-1',
                tx_hash: '64155D5128022E445302CDABBF962707717D7E9D8FCCCE895DAD39D787763768',
                explorer_link:
                  'https://www.mintscan.io/noble/txs/64155D5128022E445302CDABBF962707717D7E9D8FCCCE895DAD39D787763768',
              },
              timeout_tx: null,
              error: null,
            },
            src_chain_id: 'noble-1',
            dst_chain_id: 'dydx-mainnet-1',
          },
        },
      ],
      next_blocking_transfer: null,
      transfer_asset_release: {
        chain_id: 'dydx-mainnet-1',
        denom: 'ibc/8E27BA2D5493AF5636760E354E46004562C46AB7EC0CC4C1CA14E9E20E2545B5',
        released: true,
      },
      error: null,
    },
  ],
  state: 'STATE_COMPLETED_SUCCESS',
  transfer_sequence: [
    {
      axelar_transfer: {
        from_chain_id: '1',
        to_chain_id: 'osmosis-1',
        type: 'AXELAR_TRANSFER_CONTRACT_CALL_WITH_TOKEN',
        state: 'AXELAR_TRANSFER_SUCCESS',
        txs: {
          contract_call_with_token_txs: {
            send_tx: {
              chain_id: '1',
              tx_hash: '0x6792ba9fa4d1a0316ffabad1541dc4c5ddcd8c4bb38b9a1368f08931f9c14e1c',
              explorer_link:
                'https://etherscan.io/tx/0x6792ba9fa4d1a0316ffabad1541dc4c5ddcd8c4bb38b9a1368f08931f9c14e1c',
            },
            gas_paid_tx: {
              chain_id: '1',
              tx_hash: '0x6792ba9fa4d1a0316ffabad1541dc4c5ddcd8c4bb38b9a1368f08931f9c14e1c',
              explorer_link:
                'https://etherscan.io/tx/0x6792ba9fa4d1a0316ffabad1541dc4c5ddcd8c4bb38b9a1368f08931f9c14e1c',
            },
            confirm_tx: {
              chain_id: 'axelar-dojo-1',
              tx_hash: '282FEBD83D4D67558D40D94D2B1F212738CC293E7426123D3A415E134E41C0E0',
              explorer_link:
                'https://mintscan.io/axelar/tx/282FEBD83D4D67558D40D94D2B1F212738CC293E7426123D3A415E134E41C0E0',
            },
            approve_tx: null,
            execute_tx: {
              chain_id: 'osmosis-1',
              tx_hash: '2ED2F33533EBE597EEA656F7822F2CE585240544BC3E78F6945E6446997740F0',
              explorer_link:
                'https://www.mintscan.io/osmosis/transactions/2ED2F33533EBE597EEA656F7822F2CE585240544BC3E78F6945E6446997740F0',
            },
            error: null,
          },
        },
        axelar_scan_link:
          'https://axelarscan.io/gmp/0x6792ba9fa4d1a0316ffabad1541dc4c5ddcd8c4bb38b9a1368f08931f9c14e1c',
        src_chain_id: '1',
        dst_chain_id: 'osmosis-1',
      },
    },
    {
      ibc_transfer: {
        from_chain_id: 'osmosis-1',
        to_chain_id: 'noble-1',
        state: 'TRANSFER_SUCCESS',
        packet_txs: {
          send_tx: {
            chain_id: 'osmosis-1',
            tx_hash: '2ED2F33533EBE597EEA656F7822F2CE585240544BC3E78F6945E6446997740F0',
            explorer_link:
              'https://www.mintscan.io/osmosis/transactions/2ED2F33533EBE597EEA656F7822F2CE585240544BC3E78F6945E6446997740F0',
          },
          receive_tx: {
            chain_id: 'noble-1',
            tx_hash: 'D8E14E9BD6E1FB14BC1451E4F973A070E35257FF7D392D9F499BAD0CA9ECAFD4',
            explorer_link:
              'https://www.mintscan.io/noble/txs/D8E14E9BD6E1FB14BC1451E4F973A070E35257FF7D392D9F499BAD0CA9ECAFD4',
          },
          acknowledge_tx: {
            chain_id: 'osmosis-1',
            tx_hash: 'D6EB805D774E89F81FBBBAF4DDE5FE22EF5237B89AD8178080C024237443783E',
            explorer_link:
              'https://www.mintscan.io/osmosis/transactions/D6EB805D774E89F81FBBBAF4DDE5FE22EF5237B89AD8178080C024237443783E',
          },
          timeout_tx: null,
          error: null,
        },
        src_chain_id: 'osmosis-1',
        dst_chain_id: 'noble-1',
      },
    },
    {
      ibc_transfer: {
        from_chain_id: 'noble-1',
        to_chain_id: 'dydx-mainnet-1',
        state: 'TRANSFER_SUCCESS',
        packet_txs: {
          send_tx: {
            chain_id: 'noble-1',
            tx_hash: 'D8E14E9BD6E1FB14BC1451E4F973A070E35257FF7D392D9F499BAD0CA9ECAFD4',
            explorer_link:
              'https://www.mintscan.io/noble/txs/D8E14E9BD6E1FB14BC1451E4F973A070E35257FF7D392D9F499BAD0CA9ECAFD4',
          },
          receive_tx: {
            chain_id: 'dydx-mainnet-1',
            tx_hash: '1AA3F46507A9E0A1D183625BA5C65D6A9AAC546E346382A33D3D15F064349579',
            explorer_link:
              'https://www.mintscan.io/dydx/txs/1AA3F46507A9E0A1D183625BA5C65D6A9AAC546E346382A33D3D15F064349579',
          },
          acknowledge_tx: {
            chain_id: 'noble-1',
            tx_hash: '64155D5128022E445302CDABBF962707717D7E9D8FCCCE895DAD39D787763768',
            explorer_link:
              'https://www.mintscan.io/noble/txs/64155D5128022E445302CDABBF962707717D7E9D8FCCCE895DAD39D787763768',
          },
          timeout_tx: null,
          error: null,
        },
        src_chain_id: 'noble-1',
        dst_chain_id: 'dydx-mainnet-1',
      },
    },
  ],
  next_blocking_transfer: null,
  transfer_asset_release: {
    chain_id: 'dydx-mainnet-1',
    denom: 'ibc/8E27BA2D5493AF5636760E354E46004562C46AB7EC0CC4C1CA14E9E20E2545B5',
    released: true,
  },
  error: null,
  status: 'STATE_COMPLETED',
} as TxStatusResponseJSON;
