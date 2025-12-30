import { randomBytes } from "crypto"

export const USDC_ASSET = "0x7416a56f222e196d0487dce8a1a8003936862e7a15092a91898d69fa8bce290c"
export const BNB_ASSET = "0x1bc6d6279e196b1fa7b94a792d57a47433858940c1b3500f2a5e69640cd12ef4"
export const BTC_ASSET = "0x7404e3d104ea7841c3d9e6fd20adfe99b4ad586bc08d8f3bd3afef894cf184de"
export const ETH_ASSET = "0x59102b37de83bdda9f38ac8254e596f0d9ac61d2035c07936675e87342817160"

export function getArgs(requiredArgs: string[], optionalArgs: string[] = []): Record<string, string | boolean> {
    const argsObject: Record<string, string | boolean> = process.argv.reduce(
        (args, arg) => {
            // long arg
            if (arg.slice(0, 2) === "--") {
                const longArg = arg.split("=")
                const longArgFlag = longArg[0].slice(2)
                const longArgValue = longArg.length > 1 ? longArg[1] : true
                args[longArgFlag] = longArgValue
            }
            // flags
            else if (arg[0] === "-") {
                const flags = arg.slice(1).split("")
                flags.forEach((flag) => {
                    args[flag] = true
                })
            }
            return args
        },
        {} as Record<string, string | boolean>,
    )
    requiredArgs.forEach((arg) => {
        if (!(arg in argsObject)) {
            throw new Error(`Required argument ${arg} not provided`)
        }
    })
    Object.keys(argsObject).forEach((arg) => {
        if (!optionalArgs.includes(arg) && !requiredArgs.includes(arg)) {
            throw new Error(`Invalid argument ${arg}`)
        }
    })
    return argsObject
}

export async function call(fnCall: any) {
    const { gasUsed } = await fnCall.getTransactionCost()
    // console.log("gasUsed", gasUsed.toString())
    const gasLimit = gasUsed.mul("6").div("5").toString()

    const { waitForResult } = await fnCall.txParams({ gasLimit }).call()
    return waitForResult()
}

export function getRandomSalt() {
    const buf = randomBytes(32)
    return `0x${buf.toString("hex")}`
}
