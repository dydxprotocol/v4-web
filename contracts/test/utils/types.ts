export type Address = {
    bits: string
}

export type ContractId = {
    bits: string
}

export type AssetId = {
    bits: string
}

type Enum<T> = {
    [K in keyof T]: Pick<T, K> & { [P in Exclude<keyof T, K>]?: never }
}[keyof T]

export type Identity = Enum<{ Address: Address; ContractId: ContractId }>

export type ContractIdentity = {
    ContractId: { bits: string }
}

export type AddressIdentity = {
    Address: { bits: string }
}
