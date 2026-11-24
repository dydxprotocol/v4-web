import { fromBech32, toBech32 } from '@cosmjs/encoding';
import {
  concat,
  decodeAbiParameters,
  encodeAbiParameters,
  type Hex,
  pad,
  slice,
  toHex,
  zeroAddress,
} from 'viem';
import { describe, expect, it } from 'vitest';

import {
  assertExpectedEnableTypedData,
  assertExpectedSolanaPolicy,
  DepositPolicyValidationError,
  getInjectiveMintRecipient,
} from '../depositPolicyExpectations';
// A response of the indexer's deposit policy endpoint for an account with the earlier policy,
// generated with the indexer's own code. The user's EVM key is the first account of the phrase
// Hardhat uses for its test accounts, and the Injective account named is that of the second.
import response from './depositPolicyResponse.fixture.json';

const DYDX_ADDRESS = response.dydxAddress;
const INJECTIVE_ADDRESS = response.injectiveAddress;
// The 20 bytes of INJECTIVE_ADDRESS, as they appear wherever the policy names the recipient.
const INJECTIVE_ADDRESS_HEX = '70997970c51812dc3a010c7d01b50e0d17dc79c8';
const EVM_ADDRESS = response.evm.address;
const OTHER_RECIPIENT = pad('0x00000000000000000000000000000000deadbeef', { size: 32 });

const BYTES_ARRAY = [{ type: 'bytes[]' }] as const;
const PERMISSIONS = [
  {
    type: 'tuple[]',
    components: [
      { name: 'callType', type: 'bytes1' },
      { name: 'target', type: 'address' },
      { name: 'selector', type: 'bytes4' },
      { name: 'valueLimit', type: 'uint256' },
      {
        name: 'rules',
        type: 'tuple[]',
        components: [
          { name: 'condition', type: 'uint8' },
          { name: 'offset', type: 'uint64' },
          { name: 'params', type: 'bytes32[]' },
        ],
      },
    ],
  },
] as const;

type Rule = { condition: number; offset: bigint; params: Hex[] };
type Permission = {
  callType: Hex;
  target: Hex;
  selector: Hex;
  valueLimit: bigint;
  rules: Rule[];
};
type Decoded = { policyHeader: Hex; permissions: Permission[]; rest: Hex[] };

// The flag and the address of the policy contract that precede the permissions.
const POLICY_HEADER_SIZE = 22;

function getTypedData(chainId: string): any {
  const approval = response.evm.approvals.find((a) => a.chainId === chainId);
  return structuredClone(approval!.typedData);
}

/** Returns the typed data for a chain with its permissions changed by `change`. */
function withChangedPermissions(chainId: string, change: (decoded: Decoded) => void): any {
  const typedData = getTypedData(chainId);
  const [entries] = decodeAbiParameters(BYTES_ARRAY, typedData.message.validatorData);
  const [permissions] = decodeAbiParameters(PERMISSIONS, slice(entries[0]!, POLICY_HEADER_SIZE));
  const decoded: Decoded = {
    policyHeader: slice(entries[0]!, 0, POLICY_HEADER_SIZE),
    permissions: structuredClone(permissions) as unknown as Permission[],
    rest: entries.slice(1),
  };
  change(decoded);
  typedData.message.validatorData = encodeAbiParameters(BYTES_ARRAY, [
    [
      concat([
        decoded.policyHeader,
        encodeAbiParameters(PERMISSIONS, [decoded.permissions as any]),
      ]),
      ...decoded.rest,
    ],
  ]);
  return typedData;
}

const check = (typedData: any, chainId: string) =>
  assertExpectedEnableTypedData({
    typedData,
    chainId: Number(chainId),
    injectiveAddress: INJECTIVE_ADDRESS,
    evmAddress: EVM_ADDRESS,
  });

/** The Injective account with the address bytes of an address of another chain. */
function withInjectivePrefix(address: string) {
  return toBech32('inj', fromBech32(address).data);
}

/** The fixture's Injective address with one of its bytes changed. */
function getOtherInjectiveAddress() {
  const { data } = fromBech32(INJECTIVE_ADDRESS);
  data[0] = data[0]! + 1;
  return toBech32('inj', data);
}

describe('getInjectiveMintRecipient', () => {
  it('is the address bytes of the Injective account, padded to 32', () => {
    expect(getInjectiveMintRecipient(INJECTIVE_ADDRESS)).toEqual(
      `0x000000000000000000000000${INJECTIVE_ADDRESS_HEX}`
    );
  });

  it.each([
    ['a dYdX address', DYDX_ADDRESS],
    ['an EVM address', EVM_ADDRESS],
    ['an address with a bad checksum', `${INJECTIVE_ADDRESS.slice(0, -1)}q`],
    ['an address in upper case', INJECTIVE_ADDRESS.toUpperCase()],
    ['an address that is not 20 bytes', toBech32('inj', new Uint8Array(32))],
    ['an empty string', ''],
  ])('rejects %s', (_name, address) => {
    expect(() => getInjectiveMintRecipient(address)).toThrow(DepositPolicyValidationError);
  });
});

describe('assertExpectedEnableTypedData', () => {
  const chainIds = response.evm.approvals.map((a) => a.chainId);

  it('covers every chain deposits are bridged from', () => {
    expect([...chainIds].sort()).toEqual(['1', '10', '42161', '43114', '8453']);
  });

  it.each(chainIds)('accepts what the indexer asks for on chain %s', (chainId) => {
    expect(() => check(getTypedData(chainId), chainId)).not.toThrow();
  });

  // So that the changed requests below are rejected for the change and not for the re-encoding.
  it.each(chainIds)('accepts a re-encoding of the same permissions on chain %s', (chainId) => {
    const reencoded = withChangedPermissions(chainId, () => {});
    expect(reencoded.message.validatorData.toLowerCase()).toEqual(
      getTypedData(chainId).message.validatorData.toLowerCase()
    );
    expect(() => check(reencoded, chainId)).not.toThrow();
  });

  describe.each(chainIds)('on chain %s, rejects', (chainId) => {
    const rejects = (typedData: any) =>
      expect(() => check(typedData, chainId)).toThrow(DepositPolicyValidationError);

    it('another recipient', () => {
      rejects(
        withChangedPermissions(chainId, ({ permissions }) => {
          permissions[1]!.rules[1]!.params = [OTHER_RECIPIENT];
        })
      );
    });

    it('a recipient that is one of several allowed', () => {
      rejects(
        withChangedPermissions(chainId, ({ permissions }) => {
          permissions[1]!.rules[1]!.params.push(OTHER_RECIPIENT);
        })
      );
    });

    it('a recipient that is not checked', () => {
      rejects(
        withChangedPermissions(chainId, ({ permissions }) => {
          permissions[1]!.rules.splice(1, 1);
        })
      );
    });

    it('another destination chain', () => {
      rejects(
        withChangedPermissions(chainId, ({ permissions }) => {
          permissions[1]!.rules[0]!.params = [pad(toHex(4), { size: 32 })];
        })
      );
    });

    it('a higher fee for the relayer', () => {
      rejects(
        withChangedPermissions(chainId, ({ permissions }) => {
          permissions[1]!.rules[3]!.params = [pad(toHex(5_000_001), { size: 32 })];
        })
      );
    });

    it('a fee for the relayer that is not capped', () => {
      rejects(
        withChangedPermissions(chainId, ({ permissions }) => {
          // The condition for "greater than or equal".
          permissions[1]!.rules[3]!.condition = 3;
        })
      );
    });

    it('another spender of USDC', () => {
      rejects(
        withChangedPermissions(chainId, ({ permissions }) => {
          permissions[0]!.rules[0]!.params = [OTHER_RECIPIENT];
        })
      );
    });

    it('a call to another contract', () => {
      rejects(
        withChangedPermissions(chainId, ({ permissions }) => {
          permissions[1]!.target = '0x00000000000000000000000000000000DeaDBeef';
        })
      );
    });

    it('another function', () => {
      rejects(
        withChangedPermissions(chainId, ({ permissions }) => {
          // transfer(address,uint256)
          permissions[0]!.selector = '0xa9059cbb';
        })
      );
    });

    it('a call that sends native currency', () => {
      rejects(
        withChangedPermissions(chainId, ({ permissions }) => {
          permissions[1]!.valueLimit = BigInt(1);
        })
      );
    });

    it('a delegatecall', () => {
      rejects(
        withChangedPermissions(chainId, ({ permissions }) => {
          permissions[1]!.callType = '0xff';
        })
      );
    });

    it('an extra permission', () => {
      rejects(
        withChangedPermissions(chainId, ({ permissions }) => {
          permissions.push({
            callType: '0x00',
            target: '0x00000000000000000000000000000000DeaDBeef',
            selector: '0xa9059cbb',
            valueLimit: BigInt(0),
            rules: [],
          });
        })
      );
    });

    it('another policy contract', () => {
      rejects(
        withChangedPermissions(chainId, (decoded) => {
          decoded.policyHeader = concat(['0x0000', '0x00000000000000000000000000000000DeaDBeef']);
        })
      );
    });

    it('a policy that is skipped for some validations', () => {
      rejects(
        withChangedPermissions(chainId, (decoded) => {
          decoded.policyHeader = concat(['0x0001', slice(decoded.policyHeader, 2)]);
        })
      );
    });

    it('a second signer', () => {
      rejects(
        withChangedPermissions(chainId, (decoded) => {
          decoded.rest.push(decoded.rest[0]!);
        })
      );
    });

    it('a signer that is not an ECDSA key', () => {
      rejects(
        withChangedPermissions(chainId, (decoded) => {
          decoded.rest[0] = concat([
            '0x0000',
            '0x00000000000000000000000000000000DeaDBeef',
            slice(decoded.rest[0]!, 22),
          ]);
        })
      );
    });

    it('no policy at all', () => {
      rejects(
        withChangedPermissions(chainId, (decoded) => {
          decoded.permissions = [];
        })
      );
      const typedData = getTypedData(chainId);
      const [entries] = decodeAbiParameters(BYTES_ARRAY, typedData.message.validatorData);
      typedData.message.validatorData = encodeAbiParameters(BYTES_ARRAY, [[entries[1]!]]);
      rejects(typedData);
    });

    it('trailing data after the permissions', () => {
      const typedData = getTypedData(chainId);
      typedData.message.validatorData = `${typedData.message.validatorData}00`;
      rejects(typedData);
    });

    it('a hook', () => {
      const withHook = getTypedData(chainId);
      withHook.message.hook = '0x00000000000000000000000000000000DeaDBeef';
      rejects(withHook);

      const withHookData = getTypedData(chainId);
      withHookData.message.hookData = '0x01';
      rejects(withHookData);
    });

    it('another action', () => {
      const typedData = getTypedData(chainId);
      // The selector of `execute` replaced with another one.
      typedData.message.selectorData = `0xdeadbeef${typedData.message.selectorData.slice(10)}`;
      rejects(typedData);
    });

    it('a validation id that is not for a permission', () => {
      const typedData = getTypedData(chainId);
      // The type for a validator, which would be installed with full control of the account.
      typedData.message.validationId = `0x01${typedData.message.validationId.slice(4)}`;
      rejects(typedData);
    });

    it('another chain', () => {
      const typedData = getTypedData(chainId);
      typedData.domain.chainId = chainId === '1' ? 10 : 1;
      rejects(typedData);
    });

    it('another domain', () => {
      const otherName = getTypedData(chainId);
      otherName.domain.name = 'Permit2';
      rejects(otherName);

      const otherVersion = getTypedData(chainId);
      otherVersion.domain.version = '0.2.4';
      rejects(otherVersion);
    });

    it('other types', () => {
      const otherPrimaryType = getTypedData(chainId);
      otherPrimaryType.primaryType = 'Permit';
      rejects(otherPrimaryType);

      const otherField = getTypedData(chainId);
      otherField.types.Enable[3].name = 'data';
      rejects(otherField);

      const extraType = getTypedData(chainId);
      extraType.types.Permit = [{ name: 'spender', type: 'address' }];
      rejects(extraType);
    });
  });

  it('rejects typed data for the account of another key', () => {
    const typedData = getTypedData('42161');
    typedData.domain.verifyingContract = '0x00000000000000000000000000000000DeaDBeef';
    expect(() => check(typedData, '42161')).toThrow(DepositPolicyValidationError);
    expect(() =>
      assertExpectedEnableTypedData({
        typedData: getTypedData('42161'),
        chainId: 42161,
        injectiveAddress: INJECTIVE_ADDRESS,
        evmAddress: zeroAddress,
      })
    ).toThrow(DepositPolicyValidationError);
  });

  it.each([
    ['another Injective account', getOtherInjectiveAddress()],
    // What the indexer would bridge to if it derived the address itself.
    ['the Injective account with the bytes of the dYdX address', withInjectivePrefix(DYDX_ADDRESS)],
    ['something that is not an Injective account', DYDX_ADDRESS],
  ])('rejects the policy when the app holds the key of %s', (_name, injectiveAddress) => {
    expect(() =>
      assertExpectedEnableTypedData({
        typedData: getTypedData('42161'),
        chainId: 42161,
        injectiveAddress,
        evmAddress: EVM_ADDRESS,
      })
    ).toThrow(DepositPolicyValidationError);
  });

  it('names the Injective account once, as the recipient of the bridge call', () => {
    const { validatorData } = getTypedData('42161').message;
    expect(validatorData.toLowerCase().split(INJECTIVE_ADDRESS_HEX)).toHaveLength(2);
  });

  it('rejects typed data offered for a chain it was not made for', () => {
    expect(() => check(getTypedData('1'), '10')).toThrow(DepositPolicyValidationError);
  });

  it('rejects chains deposits are not bridged from', () => {
    const typedData = getTypedData('1');
    typedData.domain.chainId = 137;
    expect(() => check(typedData, '137')).toThrow(DepositPolicyValidationError);
  });

  it('rejects a missing or malformed request', () => {
    expect(() => check(undefined, '1')).toThrow(DepositPolicyValidationError);
    expect(() => check({}, '1')).toThrow(DepositPolicyValidationError);
    const typedData = getTypedData('1');
    typedData.message.validatorData = '0x1234';
    expect(() => check(typedData, '1')).toThrow(DepositPolicyValidationError);
  });
});

describe('assertExpectedSolanaPolicy', () => {
  const getPolicy = (): any => structuredClone(response.solana.policy);
  const rejects = (policy: any, injectiveAddress = INJECTIVE_ADDRESS) =>
    expect(() => assertExpectedSolanaPolicy({ policy, injectiveAddress })).toThrow(
      DepositPolicyValidationError
    );

  it('accepts what the indexer asks for', () => {
    expect(
      assertExpectedSolanaPolicy({ policy: getPolicy(), injectiveAddress: INJECTIVE_ADDRESS })
    ).toEqual(response.solana.policy);
  });

  it('drops fields it has not checked', () => {
    const policy = { ...getPolicy(), organizationId: 'another-organization' };
    expect(assertExpectedSolanaPolicy({ policy, injectiveAddress: INJECTIVE_ADDRESS })).toEqual(
      response.solana.policy
    );
  });

  it('rejects another recipient', () => {
    const policy = getPolicy();
    expect(policy.condition).toContain(`'000000000000000000000000${INJECTIVE_ADDRESS_HEX}'`);
    policy.condition = policy.condition.replace(
      `000000000000000000000000${INJECTIVE_ADDRESS_HEX}`,
      OTHER_RECIPIENT.slice(2)
    );
    rejects(policy);
  });

  it('rejects the policy when the app holds the key of another Injective account', () => {
    rejects(getPolicy(), getOtherInjectiveAddress());
    rejects(getPolicy(), withInjectivePrefix(DYDX_ADDRESS));
    rejects(getPolicy(), DYDX_ADDRESS);
  });

  it('rejects a wider condition', () => {
    const anything = getPolicy();
    anything.condition = 'true';
    rejects(anything);

    const alternative = getPolicy();
    alternative.condition = `${alternative.condition} || solana.tx.instructions.count() == 1`;
    rejects(alternative);

    const higherFee = getPolicy();
    higherFee.condition = higherFee.condition.replace('<= 1000000', '<= 1000000000');
    rejects(higherFee);
  });

  it('rejects another effect, name or approver', () => {
    const deny = getPolicy();
    deny.effect = 'EFFECT_DENY';
    rejects(deny);

    const renamed = getPolicy();
    renamed.policyName = 'Solana Bridging Policy';
    rejects(renamed);

    const anyone = getPolicy();
    anyone.consensus = 'true';
    rejects(anyone);

    const several = getPolicy();
    several.consensus = `${several.consensus} || approvers.count() > 0`;
    rejects(several);
  });

  it('rejects a missing policy', () => {
    rejects(undefined);
  });
});
