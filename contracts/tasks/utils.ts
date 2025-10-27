export function getArgs(requiredArgs: string[]) {
    const argsObject = process.argv.reduce((args, arg) => {
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
    }, {})
    requiredArgs.forEach((arg) => {
        if (!argsObject[arg]) {
            throw new Error(`Required argument ${arg} not provided`)
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
