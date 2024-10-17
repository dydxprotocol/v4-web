import { TxStatusResponseJSON } from '@skip-router/core';

export const withdrawToBinanceBNBSubmitted = {
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

export const withdrawToBinanceBNBPending = {
  transfers: [
    {
      state: 'STATE_PENDING',
      transfer_sequence: [
        {
          ibc_transfer: {
            from_chain_id: 'dydx-mainnet-1',
            to_chain_id: 'noble-1',
            state: 'TRANSFER_SUCCESS',
            packet_txs: {
              send_tx: {
                chain_id: 'dydx-mainnet-1',
                tx_hash: '7B90D124C9F934E43E7080BB4997854A4C0A0AF4F09A8779A88D0CBDA335D35A',
                explorer_link:
                  'https://www.mintscan.io/dydx/txs/7B90D124C9F934E43E7080BB4997854A4C0A0AF4F09A8779A88D0CBDA335D35A',
              },
              receive_tx: {
                chain_id: 'noble-1',
                tx_hash: 'FB1D78E9FEE7143ED78075DF1EA04A1B69560CB71010577B542E9AA6622833A2',
                explorer_link:
                  'https://www.mintscan.io/noble/txs/FB1D78E9FEE7143ED78075DF1EA04A1B69560CB71010577B542E9AA6622833A2',
              },
              acknowledge_tx: {
                chain_id: 'dydx-mainnet-1',
                tx_hash: '9CAE6355C37CE8DF48DFDAC86D538490170B10D4EF15ACF1CB281D4D4453DB89',
                explorer_link:
                  'https://www.mintscan.io/dydx/txs/9CAE6355C37CE8DF48DFDAC86D538490170B10D4EF15ACF1CB281D4D4453DB89',
              },
              timeout_tx: null,
              error: null,
            },
            src_chain_id: 'dydx-mainnet-1',
            dst_chain_id: 'noble-1',
          },
        },
        {
          ibc_transfer: {
            from_chain_id: 'noble-1',
            to_chain_id: 'osmosis-1',
            state: 'TRANSFER_SUCCESS',
            packet_txs: {
              send_tx: {
                chain_id: 'noble-1',
                tx_hash: 'FB1D78E9FEE7143ED78075DF1EA04A1B69560CB71010577B542E9AA6622833A2',
                explorer_link:
                  'https://www.mintscan.io/noble/txs/FB1D78E9FEE7143ED78075DF1EA04A1B69560CB71010577B542E9AA6622833A2',
              },
              receive_tx: {
                chain_id: 'osmosis-1',
                tx_hash: '169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
                explorer_link:
                  'https://www.mintscan.io/osmosis/transactions/169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
              },
              acknowledge_tx: {
                chain_id: 'noble-1',
                tx_hash: '21E98EF6CD55BFB73F5585F70F15F90DB0F9CBC3B56D75E692BA488B7701E5A9',
                explorer_link:
                  'https://www.mintscan.io/noble/txs/21E98EF6CD55BFB73F5585F70F15F90DB0F9CBC3B56D75E692BA488B7701E5A9',
              },
              timeout_tx: null,
              error: null,
            },
            src_chain_id: 'noble-1',
            dst_chain_id: 'osmosis-1',
          },
        },
        {
          axelar_transfer: {
            from_chain_id: 'osmosis-1',
            to_chain_id: '56',
            type: 'AXELAR_TRANSFER_CONTRACT_CALL_WITH_TOKEN',
            state: 'AXELAR_TRANSFER_PENDING_CONFIRMATION',
            txs: {
              contract_call_with_token_txs: {
                send_tx: {
                  chain_id: 'osmosis-1',
                  tx_hash: '169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
                  explorer_link:
                    'https://www.mintscan.io/osmosis/transactions/169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
                },
                gas_paid_tx: {
                  chain_id: 'osmosis-1',
                  tx_hash: '169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
                  explorer_link:
                    'https://www.mintscan.io/osmosis/transactions/169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
                },
                confirm_tx: null,
                approve_tx: null,
                execute_tx: null,
                error: null,
              },
            },
            axelar_scan_link:
              'https://axelarscan.io/gmp/169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
            src_chain_id: 'osmosis-1',
            dst_chain_id: '56',
          },
        },
      ],
      next_blocking_transfer: {
        transfer_sequence_index: 2,
      },
      transfer_asset_release: null,
      error: null,
    },
  ],
  state: 'STATE_PENDING',
  transfer_sequence: [
    {
      ibc_transfer: {
        from_chain_id: 'dydx-mainnet-1',
        to_chain_id: 'noble-1',
        state: 'TRANSFER_SUCCESS',
        packet_txs: {
          send_tx: {
            chain_id: 'dydx-mainnet-1',
            tx_hash: '7B90D124C9F934E43E7080BB4997854A4C0A0AF4F09A8779A88D0CBDA335D35A',
            explorer_link:
              'https://www.mintscan.io/dydx/txs/7B90D124C9F934E43E7080BB4997854A4C0A0AF4F09A8779A88D0CBDA335D35A',
          },
          receive_tx: {
            chain_id: 'noble-1',
            tx_hash: 'FB1D78E9FEE7143ED78075DF1EA04A1B69560CB71010577B542E9AA6622833A2',
            explorer_link:
              'https://www.mintscan.io/noble/txs/FB1D78E9FEE7143ED78075DF1EA04A1B69560CB71010577B542E9AA6622833A2',
          },
          acknowledge_tx: {
            chain_id: 'dydx-mainnet-1',
            tx_hash: '9CAE6355C37CE8DF48DFDAC86D538490170B10D4EF15ACF1CB281D4D4453DB89',
            explorer_link:
              'https://www.mintscan.io/dydx/txs/9CAE6355C37CE8DF48DFDAC86D538490170B10D4EF15ACF1CB281D4D4453DB89',
          },
          timeout_tx: null,
          error: null,
        },
        src_chain_id: 'dydx-mainnet-1',
        dst_chain_id: 'noble-1',
      },
    },
    {
      ibc_transfer: {
        from_chain_id: 'noble-1',
        to_chain_id: 'osmosis-1',
        state: 'TRANSFER_SUCCESS',
        packet_txs: {
          send_tx: {
            chain_id: 'noble-1',
            tx_hash: 'FB1D78E9FEE7143ED78075DF1EA04A1B69560CB71010577B542E9AA6622833A2',
            explorer_link:
              'https://www.mintscan.io/noble/txs/FB1D78E9FEE7143ED78075DF1EA04A1B69560CB71010577B542E9AA6622833A2',
          },
          receive_tx: {
            chain_id: 'osmosis-1',
            tx_hash: '169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
            explorer_link:
              'https://www.mintscan.io/osmosis/transactions/169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
          },
          acknowledge_tx: {
            chain_id: 'noble-1',
            tx_hash: '21E98EF6CD55BFB73F5585F70F15F90DB0F9CBC3B56D75E692BA488B7701E5A9',
            explorer_link:
              'https://www.mintscan.io/noble/txs/21E98EF6CD55BFB73F5585F70F15F90DB0F9CBC3B56D75E692BA488B7701E5A9',
          },
          timeout_tx: null,
          error: null,
        },
        src_chain_id: 'noble-1',
        dst_chain_id: 'osmosis-1',
      },
    },
    {
      axelar_transfer: {
        from_chain_id: 'osmosis-1',
        to_chain_id: '56',
        type: 'AXELAR_TRANSFER_CONTRACT_CALL_WITH_TOKEN',
        state: 'AXELAR_TRANSFER_PENDING_CONFIRMATION',
        txs: {
          contract_call_with_token_txs: {
            send_tx: {
              chain_id: 'osmosis-1',
              tx_hash: '169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
              explorer_link:
                'https://www.mintscan.io/osmosis/transactions/169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
            },
            gas_paid_tx: {
              chain_id: 'osmosis-1',
              tx_hash: '169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
              explorer_link:
                'https://www.mintscan.io/osmosis/transactions/169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
            },
            confirm_tx: null,
            approve_tx: null,
            execute_tx: null,
            error: null,
          },
        },
        axelar_scan_link:
          'https://axelarscan.io/gmp/169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
        src_chain_id: 'osmosis-1',
        dst_chain_id: '56',
      },
    },
  ],
  next_blocking_transfer: {
    transfer_sequence_index: 2,
  },
  transfer_asset_release: null,
  error: null,
  status: 'STATE_PENDING',
} as TxStatusResponseJSON;

export const withdrawToBinanceBNBSuccess = {
  transfers: [
    {
      state: 'STATE_COMPLETED_SUCCESS',
      transfer_sequence: [
        {
          ibc_transfer: {
            from_chain_id: 'dydx-mainnet-1',
            to_chain_id: 'noble-1',
            state: 'TRANSFER_SUCCESS',
            packet_txs: {
              send_tx: {
                chain_id: 'dydx-mainnet-1',
                tx_hash: '7B90D124C9F934E43E7080BB4997854A4C0A0AF4F09A8779A88D0CBDA335D35A',
                explorer_link:
                  'https://www.mintscan.io/dydx/txs/7B90D124C9F934E43E7080BB4997854A4C0A0AF4F09A8779A88D0CBDA335D35A',
              },
              receive_tx: {
                chain_id: 'noble-1',
                tx_hash: 'FB1D78E9FEE7143ED78075DF1EA04A1B69560CB71010577B542E9AA6622833A2',
                explorer_link:
                  'https://www.mintscan.io/noble/txs/FB1D78E9FEE7143ED78075DF1EA04A1B69560CB71010577B542E9AA6622833A2',
              },
              acknowledge_tx: {
                chain_id: 'dydx-mainnet-1',
                tx_hash: '9CAE6355C37CE8DF48DFDAC86D538490170B10D4EF15ACF1CB281D4D4453DB89',
                explorer_link:
                  'https://www.mintscan.io/dydx/txs/9CAE6355C37CE8DF48DFDAC86D538490170B10D4EF15ACF1CB281D4D4453DB89',
              },
              timeout_tx: null,
              error: null,
            },
            src_chain_id: 'dydx-mainnet-1',
            dst_chain_id: 'noble-1',
          },
        },
        {
          ibc_transfer: {
            from_chain_id: 'noble-1',
            to_chain_id: 'osmosis-1',
            state: 'TRANSFER_SUCCESS',
            packet_txs: {
              send_tx: {
                chain_id: 'noble-1',
                tx_hash: 'FB1D78E9FEE7143ED78075DF1EA04A1B69560CB71010577B542E9AA6622833A2',
                explorer_link:
                  'https://www.mintscan.io/noble/txs/FB1D78E9FEE7143ED78075DF1EA04A1B69560CB71010577B542E9AA6622833A2',
              },
              receive_tx: {
                chain_id: 'osmosis-1',
                tx_hash: '169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
                explorer_link:
                  'https://www.mintscan.io/osmosis/transactions/169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
              },
              acknowledge_tx: {
                chain_id: 'noble-1',
                tx_hash: '21E98EF6CD55BFB73F5585F70F15F90DB0F9CBC3B56D75E692BA488B7701E5A9',
                explorer_link:
                  'https://www.mintscan.io/noble/txs/21E98EF6CD55BFB73F5585F70F15F90DB0F9CBC3B56D75E692BA488B7701E5A9',
              },
              timeout_tx: null,
              error: null,
            },
            src_chain_id: 'noble-1',
            dst_chain_id: 'osmosis-1',
          },
        },
        {
          axelar_transfer: {
            from_chain_id: 'osmosis-1',
            to_chain_id: '56',
            type: 'AXELAR_TRANSFER_CONTRACT_CALL_WITH_TOKEN',
            state: 'AXELAR_TRANSFER_SUCCESS',
            txs: {
              contract_call_with_token_txs: {
                send_tx: {
                  chain_id: 'osmosis-1',
                  tx_hash: '169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
                  explorer_link:
                    'https://www.mintscan.io/osmosis/transactions/169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
                },
                gas_paid_tx: {
                  chain_id: 'osmosis-1',
                  tx_hash: '169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
                  explorer_link:
                    'https://www.mintscan.io/osmosis/transactions/169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
                },
                confirm_tx: {
                  chain_id: 'axelar-dojo-1',
                  tx_hash: '8993C64807AA17F5C8D0B77B25D26CAE9CB4742EDB985793AF4A06AC61143FA9',
                  explorer_link:
                    'https://mintscan.io/axelar/tx/8993C64807AA17F5C8D0B77B25D26CAE9CB4742EDB985793AF4A06AC61143FA9',
                },
                approve_tx: {
                  chain_id: '56',
                  tx_hash: '0x0af1a1868e85b8551713efb26f401ccd395fb9f1e5f493ee7af9dc5f01993a55',
                  explorer_link:
                    'https://bscscan.com/tx/0x0af1a1868e85b8551713efb26f401ccd395fb9f1e5f493ee7af9dc5f01993a55',
                },
                execute_tx: {
                  chain_id: '56',
                  tx_hash: '0x5db38d3606bc8bdb487f94fb87feeccf39cf96679f8267899bc70751e08b2edb',
                  explorer_link:
                    'https://bscscan.com/tx/0x5db38d3606bc8bdb487f94fb87feeccf39cf96679f8267899bc70751e08b2edb',
                },
                error: null,
              },
            },
            axelar_scan_link:
              'https://axelarscan.io/gmp/169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
            src_chain_id: 'osmosis-1',
            dst_chain_id: '56',
          },
        },
      ],
      next_blocking_transfer: null,
      transfer_asset_release: {
        chain_id: '56',
        denom: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
        released: true,
      },
      error: null,
    },
  ],
  state: 'STATE_COMPLETED_SUCCESS',
  transfer_sequence: [
    {
      ibc_transfer: {
        from_chain_id: 'dydx-mainnet-1',
        to_chain_id: 'noble-1',
        state: 'TRANSFER_SUCCESS',
        packet_txs: {
          send_tx: {
            chain_id: 'dydx-mainnet-1',
            tx_hash: '7B90D124C9F934E43E7080BB4997854A4C0A0AF4F09A8779A88D0CBDA335D35A',
            explorer_link:
              'https://www.mintscan.io/dydx/txs/7B90D124C9F934E43E7080BB4997854A4C0A0AF4F09A8779A88D0CBDA335D35A',
          },
          receive_tx: {
            chain_id: 'noble-1',
            tx_hash: 'FB1D78E9FEE7143ED78075DF1EA04A1B69560CB71010577B542E9AA6622833A2',
            explorer_link:
              'https://www.mintscan.io/noble/txs/FB1D78E9FEE7143ED78075DF1EA04A1B69560CB71010577B542E9AA6622833A2',
          },
          acknowledge_tx: {
            chain_id: 'dydx-mainnet-1',
            tx_hash: '9CAE6355C37CE8DF48DFDAC86D538490170B10D4EF15ACF1CB281D4D4453DB89',
            explorer_link:
              'https://www.mintscan.io/dydx/txs/9CAE6355C37CE8DF48DFDAC86D538490170B10D4EF15ACF1CB281D4D4453DB89',
          },
          timeout_tx: null,
          error: null,
        },
        src_chain_id: 'dydx-mainnet-1',
        dst_chain_id: 'noble-1',
      },
    },
    {
      ibc_transfer: {
        from_chain_id: 'noble-1',
        to_chain_id: 'osmosis-1',
        state: 'TRANSFER_SUCCESS',
        packet_txs: {
          send_tx: {
            chain_id: 'noble-1',
            tx_hash: 'FB1D78E9FEE7143ED78075DF1EA04A1B69560CB71010577B542E9AA6622833A2',
            explorer_link:
              'https://www.mintscan.io/noble/txs/FB1D78E9FEE7143ED78075DF1EA04A1B69560CB71010577B542E9AA6622833A2',
          },
          receive_tx: {
            chain_id: 'osmosis-1',
            tx_hash: '169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
            explorer_link:
              'https://www.mintscan.io/osmosis/transactions/169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
          },
          acknowledge_tx: {
            chain_id: 'noble-1',
            tx_hash: '21E98EF6CD55BFB73F5585F70F15F90DB0F9CBC3B56D75E692BA488B7701E5A9',
            explorer_link:
              'https://www.mintscan.io/noble/txs/21E98EF6CD55BFB73F5585F70F15F90DB0F9CBC3B56D75E692BA488B7701E5A9',
          },
          timeout_tx: null,
          error: null,
        },
        src_chain_id: 'noble-1',
        dst_chain_id: 'osmosis-1',
      },
    },
    {
      axelar_transfer: {
        from_chain_id: 'osmosis-1',
        to_chain_id: '56',
        type: 'AXELAR_TRANSFER_CONTRACT_CALL_WITH_TOKEN',
        state: 'AXELAR_TRANSFER_SUCCESS',
        txs: {
          contract_call_with_token_txs: {
            send_tx: {
              chain_id: 'osmosis-1',
              tx_hash: '169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
              explorer_link:
                'https://www.mintscan.io/osmosis/transactions/169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
            },
            gas_paid_tx: {
              chain_id: 'osmosis-1',
              tx_hash: '169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
              explorer_link:
                'https://www.mintscan.io/osmosis/transactions/169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
            },
            confirm_tx: {
              chain_id: 'axelar-dojo-1',
              tx_hash: '8993C64807AA17F5C8D0B77B25D26CAE9CB4742EDB985793AF4A06AC61143FA9',
              explorer_link:
                'https://mintscan.io/axelar/tx/8993C64807AA17F5C8D0B77B25D26CAE9CB4742EDB985793AF4A06AC61143FA9',
            },
            approve_tx: {
              chain_id: '56',
              tx_hash: '0x0af1a1868e85b8551713efb26f401ccd395fb9f1e5f493ee7af9dc5f01993a55',
              explorer_link:
                'https://bscscan.com/tx/0x0af1a1868e85b8551713efb26f401ccd395fb9f1e5f493ee7af9dc5f01993a55',
            },
            execute_tx: {
              chain_id: '56',
              tx_hash: '0x5db38d3606bc8bdb487f94fb87feeccf39cf96679f8267899bc70751e08b2edb',
              explorer_link:
                'https://bscscan.com/tx/0x5db38d3606bc8bdb487f94fb87feeccf39cf96679f8267899bc70751e08b2edb',
            },
            error: null,
          },
        },
        axelar_scan_link:
          'https://axelarscan.io/gmp/169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
        src_chain_id: 'osmosis-1',
        dst_chain_id: '56',
      },
    },
  ],
  next_blocking_transfer: null,
  transfer_asset_release: {
    chain_id: '56',
    denom: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    released: true,
  },
  error: null,
  status: 'STATE_COMPLETED',
} as TxStatusResponseJSON;
