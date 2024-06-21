import { SpyInstance, afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { TransferChainInfo } from '@/constants/abacus';
import { SkipTransactionStatus } from '@/constants/skip';

import abacusStateManager from '../abacus';
import { formSkipStatusResponse } from '../squid';
import { depositFromUsdcEthPending, depositFromUsdcEthSuccess } from './fixtures/skipCctpDeposit';
import { withdrawToUsdcEthPending, withdrawToUsdcEthSuccess } from './fixtures/skipCctpWithdrawal';
import {
  depositFromEthereumEthPending,
  depositFromEthereumEthSubmitted,
  depositFromEthereumEthSuccess,
} from './fixtures/skipNonCctpDeposit';
import {
  withdrawToBinanceBNBPending,
  withdrawToBinanceBNBSubmitted,
  withdrawToBinanceBNBSuccess,
} from './fixtures/skipNonCctpWithdrawal';

const toChainPending = (chainId: string | undefined): SkipTransactionStatus => ({
  chainData: {
    chainId,
    chainName: undefined,
    estimatedRouteDuration: '<30 minutes',
  },
  transactionUrl: undefined,
  transactionId: undefined,
});

const chainIdsToNames: { [key: string]: TransferChainInfo } = {
  1: {
    chainName: 'Ethereum',
    chainId: 'noop',
    logoUri: 'noop',
    chainType: 'noop',
    isTestnet: false,
    copy: vi.fn(),
    equals: vi.fn(),
    hashCode: vi.fn(),
  },
  56: {
    chainName: 'BNB Smart Chain',
    chainId: 'noop',
    logoUri: 'noop',
    chainType: 'noop',
    isTestnet: false,
    copy: vi.fn(),
    equals: vi.fn(),
    hashCode: vi.fn(),
  },
  'noble-1': {
    chainName: 'noble',
    chainId: 'noop',
    logoUri: 'noop',
    chainType: 'noop',
    isTestnet: false,
    copy: vi.fn(),
    equals: vi.fn(),
    hashCode: vi.fn(),
  },
  'dydx-mainnet-1': {
    chainName: 'dydx',
    chainId: 'noop',
    logoUri: 'noop',
    chainType: 'noop',
    isTestnet: false,
    copy: vi.fn(),
    equals: vi.fn(),
    hashCode: vi.fn(),
  },
};

let mockGetChainById: SpyInstance;

beforeAll(() => {
  mockGetChainById = vi
    .spyOn(abacusStateManager, 'getChainById')
    .mockImplementation((chainId: string) => {
      return chainIdsToNames[chainId as keyof typeof chainIdsToNames];
    });
});

afterAll(() => {
  mockGetChainById.mockRestore();
});

describe('formSkipStatusResponse - non CCTP Deposit', () => {
  it('converts deposit from ethereum on ETH Submitted payload', () => {
    const transferStatusResponse = depositFromEthereumEthSubmitted;
    const expected = {};
    const result = formSkipStatusResponse(transferStatusResponse);
    expect(result).toMatchObject(expected);
  });
  it('converts deposit from ethereum on ETH Pending payload', () => {
    const transferStatusResponse = depositFromEthereumEthPending;
    const expected = {
      axelarTransactionUrl:
        'https://axelarscan.io/gmp/0x6792ba9fa4d1a0316ffabad1541dc4c5ddcd8c4bb38b9a1368f08931f9c14e1c',
      squidTransactionStatus: 'ongoing',
      routeStatus: [
        {
          chainId: '1',
          txHash: '0x6792ba9fa4d1a0316ffabad1541dc4c5ddcd8c4bb38b9a1368f08931f9c14e1c',
          status: 'success',
        },
        {
          chainId: 'osmosis-1',
          status: 'ongoing',
          txHash: undefined,
        },
      ],
      fromChain: {
        chainData: {
          chainId: '1',
          chainName: 'Ethereum',
          estimatedRouteDuration: '<30 minutes',
        },
        transactionId: '0x6792ba9fa4d1a0316ffabad1541dc4c5ddcd8c4bb38b9a1368f08931f9c14e1c',
        transactionUrl:
          'https://etherscan.io/tx/0x6792ba9fa4d1a0316ffabad1541dc4c5ddcd8c4bb38b9a1368f08931f9c14e1c',
      },
      toChain: toChainPending('osmosis-1'),
      error: undefined,
    };
    const result = formSkipStatusResponse(transferStatusResponse);
    expect(result).toMatchObject(expected);
  });
  it('converts deposit from ethereum on ETH Success payload', () => {
    const transferStatusResponse = depositFromEthereumEthSuccess;
    const expected = {
      squidTransactionStatus: 'success',
      axelarTransactionUrl:
        'https://axelarscan.io/gmp/0x6792ba9fa4d1a0316ffabad1541dc4c5ddcd8c4bb38b9a1368f08931f9c14e1c',
      fromChain: {
        chainData: {
          chainId: '1',
          chainName: 'Ethereum',
          estimatedRouteDuration: '<30 minutes',
        },
        transactionId: '0x6792ba9fa4d1a0316ffabad1541dc4c5ddcd8c4bb38b9a1368f08931f9c14e1c',
        transactionUrl:
          'https://etherscan.io/tx/0x6792ba9fa4d1a0316ffabad1541dc4c5ddcd8c4bb38b9a1368f08931f9c14e1c',
      },
      toChain: {
        chainData: {
          chainId: 'dydx-mainnet-1',
          chainName: 'dydx',
          estimatedRouteDuration: '<30 minutes',
        },
        transactionId: '1AA3F46507A9E0A1D183625BA5C65D6A9AAC546E346382A33D3D15F064349579',
        transactionUrl:
          'https://www.mintscan.io/dydx/txs/1AA3F46507A9E0A1D183625BA5C65D6A9AAC546E346382A33D3D15F064349579',
      },
      routeStatus: [
        {
          chainId: '1',
          txHash: '0x6792ba9fa4d1a0316ffabad1541dc4c5ddcd8c4bb38b9a1368f08931f9c14e1c',
          status: 'success',
        },
        {
          chainId: 'dydx-mainnet-1',
          txHash: '1AA3F46507A9E0A1D183625BA5C65D6A9AAC546E346382A33D3D15F064349579',
          status: 'success',
        },
      ],
    };
    const result = formSkipStatusResponse(transferStatusResponse);
    expect(result).toMatchObject(expected);
  });
});

describe('formSkipStatusResponse - non CCTP Withdrawal', () => {
  it('converts withdrawal to bnb on bsc Submitted payload', () => {
    const transferStatusResponse = withdrawToBinanceBNBSubmitted;
    const expected = {
      axelarTransactionUrl: undefined,
      error: undefined,
      fromChain: undefined,
      routeStatus: [],
      squidTransactionStatus: 'ongoing',
      toChain: undefined,
    };
    const result = formSkipStatusResponse(transferStatusResponse);
    expect(result).toMatchObject(expected);
  });
  it('converts withdrawal to bnb on bsc Pending payload', () => {
    const transferStatusResponse = withdrawToBinanceBNBPending;
    const expected = {
      squidTransactionStatus: 'ongoing',
      axelarTransactionUrl:
        'https://axelarscan.io/gmp/169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
      fromChain: {
        chainData: {
          chainId: 'dydx-mainnet-1',
          chainName: 'dydx',
          estimatedRouteDuration: '<30 minutes',
        },
        transactionId: '7B90D124C9F934E43E7080BB4997854A4C0A0AF4F09A8779A88D0CBDA335D35A',
        transactionUrl:
          'https://www.mintscan.io/dydx/txs/7B90D124C9F934E43E7080BB4997854A4C0A0AF4F09A8779A88D0CBDA335D35A',
      },
      toChain: {
        chainData: {
          chainId: '56',
          chainName: 'BNB Smart Chain',
          estimatedRouteDuration: '<30 minutes',
        },
        transactionId: undefined,
        transactionUrl: undefined,
      },
      routeStatus: [
        {
          chainId: 'dydx-mainnet-1',
          txHash: '7B90D124C9F934E43E7080BB4997854A4C0A0AF4F09A8779A88D0CBDA335D35A',
          status: 'success',
        },
        {
          chainId: '56',
          txHash: undefined,
          status: 'ongoing',
        },
      ],
    };
    const result = formSkipStatusResponse(transferStatusResponse);
    expect(result).toMatchObject(expected);
  });
  it('converts withdrawal to bnb on bsc Success payload', () => {
    const transferStatusResponse = withdrawToBinanceBNBSuccess;
    const expected = {
      squidTransactionStatus: 'success',
      axelarTransactionUrl:
        'https://axelarscan.io/gmp/169170FB7F14E4D9EE4203A332CF29BE90E36E91CFCE5F231EFCD2D99292F974',
      fromChain: {
        chainData: {
          chainId: 'dydx-mainnet-1',
          chainName: 'dydx',
          estimatedRouteDuration: '<30 minutes',
        },
        transactionId: '7B90D124C9F934E43E7080BB4997854A4C0A0AF4F09A8779A88D0CBDA335D35A',
        transactionUrl:
          'https://www.mintscan.io/dydx/txs/7B90D124C9F934E43E7080BB4997854A4C0A0AF4F09A8779A88D0CBDA335D35A',
      },
      toChain: {
        chainData: {
          chainId: '56',
          chainName: 'BNB Smart Chain',
          estimatedRouteDuration: '<30 minutes',
        },
        transactionId: '0x5db38d3606bc8bdb487f94fb87feeccf39cf96679f8267899bc70751e08b2edb',
        transactionUrl:
          'https://bscscan.com/tx/0x5db38d3606bc8bdb487f94fb87feeccf39cf96679f8267899bc70751e08b2edb',
      },
      routeStatus: [
        {
          chainId: 'dydx-mainnet-1',
          txHash: '7B90D124C9F934E43E7080BB4997854A4C0A0AF4F09A8779A88D0CBDA335D35A',
          status: 'success',
        },
        {
          chainId: '56',
          txHash: '0x5db38d3606bc8bdb487f94fb87feeccf39cf96679f8267899bc70751e08b2edb',
          status: 'success',
        },
      ],
    };
    const result = formSkipStatusResponse(transferStatusResponse);
    expect(result).toMatchObject(expected);
  });
});

describe('formSkipStatusResponse - CCTP Deposit', () => {
  it('converts deposit from usdc on ETH Pending payload', () => {
    const transferStatusResponse = depositFromUsdcEthPending;
    const expected = {
      squidTransactionStatus: 'ongoing',
      axelarTransactionUrl: undefined,
      error: undefined,
      fromChain: {
        chainData: {
          chainId: '1',
          chainName: 'Ethereum',
          estimatedRouteDuration: '<30 minutes',
        },
        transactionId: '0x092C0BFF67A71D483A3FCC5C0B390E4AA71E5C1CB9CFC1885989734A5975210D',
        transactionUrl:
          'https://etherscan.io/tx/0x092C0BFF67A71D483A3FCC5C0B390E4AA71E5C1CB9CFC1885989734A5975210D',
      },
      toChain: {
        chainData: {
          chainId: 'noble-1',
          chainName: 'noble',
          estimatedRouteDuration: '<30 minutes',
        },
        transactionId: undefined,
        transactionUrl: undefined,
      },
      routeStatus: [
        {
          chainId: '1',
          txHash: '0x092C0BFF67A71D483A3FCC5C0B390E4AA71E5C1CB9CFC1885989734A5975210D',
          status: 'success',
        },
        {
          chainId: 'noble-1',
          txHash: undefined,
          status: 'ongoing',
        },
      ],
    };
    const result = formSkipStatusResponse(transferStatusResponse);
    expect(result).toMatchObject(expected);
  });
  it('converts deposit from usdc on ETH Success payload', () => {
    const transferStatusResponse = depositFromUsdcEthSuccess;
    const expected = {
      squidTransactionStatus: 'success',
      axelarTransactionUrl: undefined,
      error: undefined,
      fromChain: {
        chainData: {
          chainId: '1',
          chainName: 'Ethereum',
          estimatedRouteDuration: '<30 minutes',
        },
        transactionId: '0x092C0BFF67A71D483A3FCC5C0B390E4AA71E5C1CB9CFC1885989734A5975210D',
        transactionUrl:
          'https://etherscan.io/tx/0x092C0BFF67A71D483A3FCC5C0B390E4AA71E5C1CB9CFC1885989734A5975210D',
      },
      toChain: {
        chainData: {
          chainId: 'noble-1',
          chainName: 'noble',
          estimatedRouteDuration: '<30 minutes',
        },
        transactionId: 'A256406470B202AC2152EF195B50F01A2DB25C29A560DA6D89CE80662D338D12',
        transactionUrl:
          'https://www.mintscan.io/noble/txs/A256406470B202AC2152EF195B50F01A2DB25C29A560DA6D89CE80662D338D12',
      },
      routeStatus: [
        {
          chainId: '1',
          txHash: '0x092C0BFF67A71D483A3FCC5C0B390E4AA71E5C1CB9CFC1885989734A5975210D',
          status: 'success',
        },
        {
          chainId: 'noble-1',
          txHash: 'A256406470B202AC2152EF195B50F01A2DB25C29A560DA6D89CE80662D338D12',
          status: 'success',
        },
      ],
    };
    const result = formSkipStatusResponse(transferStatusResponse);
    expect(result).toMatchObject(expected);
  });
});

describe('formSkipStatusResponse - CCTP Withdrawal', () => {
  it('converts withdrawal to usdc on eth Pending payload', () => {
    const transferStatusResponse = withdrawToUsdcEthPending;
    const expected = {
      squidTransactionStatus: 'ongoing',
      axelarTransactionUrl: undefined,
      error: undefined,
      fromChain: {
        chainData: {
          chainId: 'noble-1',
          chainName: 'noble',
          estimatedRouteDuration: '<30 minutes',
        },
        transactionId: 'E550035D05238AA83BC025240B7CD1370D5516BB2D06BCDB31FA7DB229AA1E25',
        transactionUrl:
          'https://www.mintscan.io/noble/txs/E550035D05238AA83BC025240B7CD1370D5516BB2D06BCDB31FA7DB229AA1E25',
      },
      toChain: {
        chainData: {
          chainId: '1',
          chainName: 'Ethereum',
          estimatedRouteDuration: '<30 minutes',
        },
        transactionId: undefined,
        transactionUrl: undefined,
      },
      routeStatus: [
        {
          chainId: 'noble-1',
          txHash: 'E550035D05238AA83BC025240B7CD1370D5516BB2D06BCDB31FA7DB229AA1E25',
          status: 'success',
        },
        {
          chainId: '1',
          txHash: undefined,
          status: 'ongoing',
        },
      ],
    };
    const result = formSkipStatusResponse(transferStatusResponse);
    expect(result).toMatchObject(expected);
  });
  it('converts withdrawal to usdc on eth Success payload', () => {
    const transferStatusResponse = withdrawToUsdcEthSuccess;
    const expected = {
      squidTransactionStatus: 'success',
      axelarTransactionUrl: undefined,
      error: undefined,
      fromChain: {
        chainData: {
          chainId: 'noble-1',
          chainName: 'noble',
          estimatedRouteDuration: '<30 minutes',
        },
        transactionId: 'E550035D05238AA83BC025240B7CD1370D5516BB2D06BCDB31FA7DB229AA1E25',
        transactionUrl:
          'https://www.mintscan.io/noble/txs/E550035D05238AA83BC025240B7CD1370D5516BB2D06BCDB31FA7DB229AA1E25',
      },
      toChain: {
        chainData: {
          chainId: '1',
          chainName: 'Ethereum',
          estimatedRouteDuration: '<30 minutes',
        },
        transactionId: '0x969f344e567146442b28a30c52111937a703c1360db26e48ed57786630addd37',
        transactionUrl:
          'https://etherscan.io/tx/0x969f344e567146442b28a30c52111937a703c1360db26e48ed57786630addd37',
      },
      routeStatus: [
        {
          chainId: 'noble-1',
          txHash: 'E550035D05238AA83BC025240B7CD1370D5516BB2D06BCDB31FA7DB229AA1E25',
          status: 'success',
        },
        {
          chainId: '1',
          txHash: '0x969f344e567146442b28a30c52111937a703c1360db26e48ed57786630addd37',
          status: 'success',
        },
      ],
    };
    const result = formSkipStatusResponse(transferStatusResponse);
    expect(result).toMatchObject(expected);
  });
});
