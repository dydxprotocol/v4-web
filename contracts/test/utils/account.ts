import { Address, AddressIdentity, ContractId, ContractIdentity, Identity } from "./types"

export function toBits(addr: any): string {
    if (addr["toB256"]) return addr.toB256()
    if (addr["toHexString"]) return addr.toHexString()
    if (addr["address"]) return addr.address.toHexString()
    if (addr["id"]) return addr.id.toHexString()

    return addr
}

export function addrToIdentity(addr: any): AddressIdentity {
    return toIdentity(addr, false) as any
}

export function contrToIdentity(addr: any): ContractIdentity {
    return toIdentity(addr, true) as any
}

export function toIdentity(addr: any, is_contract: boolean): Identity {
    if (is_contract) {
        return { ContractId: toContract(addr) }
    }

    return { Address: toAddress(addr) }
}

export function toAddress(value: any): Address {
    return { bits: toBits(value) }
}

export function toContract(value: any): ContractId {
    return { bits: toBits(value) }
}
