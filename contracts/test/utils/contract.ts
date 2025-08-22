import { B256Coder, BN, BigNumberCoder, BooleanCoder, EnumCoder, NumberCoder, StructCoder, hexlify, keccak256 } from "fuels"
import { Vault } from "../../types"
import { getValue } from "./utils"
import { AssetId, Identity } from "./types"

/*
pub struct PositionKey {
    pub account: Identity,
    pub collateral_asset: AssetId,
    pub index_asset: AssetId,
    pub is_long: bool,
}
*/

// From here: https://github.com/FuelLabs/sway/blob/16318d302e69ef3a486ecbcad8bf7aa484d009c7/sway-lib-std/src/identity.sw#L141-L154
// The EnumCoder doesn't match the encoding scheme internally within a sway contract, so the
// following encoder is a drop-in replacement.
const PositionKeyStructEncoder = new StructCoder("Key", {
    account_key: new NumberCoder("u8"),
    account: new StructCoder("Address/ContractId", {
        bits: new B256Coder(),
    }),
    collateral_asset: new StructCoder("AssetId", {
        bits: new B256Coder(),
    }),
    index_asset: new StructCoder("AssetId", {
        bits: new B256Coder(),
    }),
    is_long: new BooleanCoder(),
})

export async function getPositionLeverage(
    vault: Vault,
    account: Identity,
    collateral_asset: AssetId,
    index_asset: AssetId,
    is_long: boolean,
) {
    const account_key = account.Address ? 0 : 1
    const positionKeyStruct = {
        account_key,
        account: account.Address ? account.Address : account.ContractId,
        collateral_asset,
        index_asset,
        is_long,
    }
    const positionKey = hexlify(keccak256(PositionKeyStructEncoder.encode(positionKeyStruct)))
    const position = await getValue(vault.functions.get_position_by_key(positionKey))

    if (position.collateral.toString() === "0") {
        throw new Error("VaultInvalidPositionSize")
    }

    const positionLeverage = new BN(position.size).mul(10000).div(position.collateral)

    return positionLeverage.toString()
}

export async function getPosition(
    account: Identity,
    collateral_asset: AssetId,
    index_asset: AssetId,
    is_long: boolean,
    vault: Vault,
) {
    const account_key = account.Address ? 0 : 1
    const positionKeyStruct = {
        account_key,
        account: account.Address ? account.Address : account.ContractId,
        collateral_asset,
        index_asset,
        is_long,
    }
    const positionKey = hexlify(keccak256(PositionKeyStructEncoder.encode(positionKeyStruct)))

    return await getValue(vault.functions.get_position_by_key(positionKey))
}
