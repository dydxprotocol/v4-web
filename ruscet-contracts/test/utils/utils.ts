import { AbstractAddress, Provider, WalletUnlocked } from "fuels"
import { Fungible, Utils } from "../../types"
import { getAssetId, toAsset } from "./asset"
import { toContract } from "./account"
import fs from "fs"
import path from "path"

export async function deploy(contract: string, wallet: WalletUnlocked, configurables: any = undefined) {
    const factory = require(`../../types/${contract}Factory.ts`)[`${contract}Factory`]
    if (!factory) {
        throw new Error(`Could not find factory for contract ${contract}`)
    }

    const { waitForResult } = await factory.deploy(wallet, configurables ? { configurableConstants: configurables } : undefined)
    const { contract: contr } = await waitForResult()

    return contr
}

export function formatComplexObject(obj: any, depth = 2) {
    if (Array.isArray(obj)) {
        const indent = " ".repeat(depth * 2)
        const elements = obj.map((item) => formatComplexObject(item, depth + 1)).join(`,\n${" ".repeat(depth * 2)}`)
        return `[\n${indent}${elements}\n${" ".repeat((depth - 1) * 2)}]`
    } else if (typeof obj === "object" && obj !== null) {
        // BN objects
        if (obj.constructor && obj.constructor.name === "BN") {
            return obj.toString() // JSON.stringify(obj)
        } else {
            const indent = " ".repeat(depth * 2)
            const entries = Object.entries(obj)
                .map(([key, value]) => `${indent}  ${key}: ${formatComplexObject(value, depth + 1)}`)
                .join(",\n")

            return `{\n${entries}\n${" ".repeat((depth - 1) * 2)}}`
        }
    } else {
        return JSON.stringify(obj)
    }
}

export async function getBalance(
    account: WalletUnlocked | { id: AbstractAddress },
    fungibleAsset: Fungible | string,
    utils: Utils | undefined = undefined,
) {
    const FUEL_NETWORK_URL = "http://127.0.0.1:4000/v1/graphql"
    const provider = await Provider.create(FUEL_NETWORK_URL)

    if (account instanceof WalletUnlocked) {
        if (typeof fungibleAsset === "string") {
            return (await provider.getBalance(account.address, fungibleAsset)).toString()
        }
        return (await provider.getBalance(account.address, getAssetId(fungibleAsset))).toString()
    }

    if (!utils) {
        throw new Error("UtilsAbi reference not provided as fallback")
    }

    let arg: any

    if (typeof fungibleAsset === "string") {
        arg = { bits: fungibleAsset }
    }

    arg = toAsset(fungibleAsset)

    return (await provider.getContractBalance(toContract(account).bits, arg.bits)).toString()
}

export async function getValue(call: any) {
    const { value } = await call.get()
    return value
}

export async function getValStr(call: any) {
    return (await getValue(call)).toString()
}

export async function call(fnCall: any) {
    const { gasUsed } = await fnCall.getTransactionCost()
    // console.log("gasUsed", gasUsed.toString())
    const gasLimit = gasUsed.mul("6").div("5").toString()

    const { waitForResult } = await fnCall.txParams({ gasLimit }).call()
    return await waitForResult()
}

export function formatObj(obj: any) {
    if (Array.isArray(obj)) {
        return obj.map((item) => formatObj(item))
    } else if (typeof obj === "object" && obj !== null) {
        // BN objects
        if (obj.constructor && ["BN", "BigNumber"].includes(obj.constructor.name)) {
            return obj.toString()
        } else {
            const newObj = {}
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    newObj[key] = formatObj(obj[key])
                }
            }
            return newObj
        }
    } else {
        return obj
    }
}
