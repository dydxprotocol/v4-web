import { Assertion, Chai } from "chai"
import { consoleLogger } from "./log"
import { formatComplexObject, formatObj } from "./utils"
type MaybePromise<T> = T | Promise<T>
type TransactionResponse = any

const isTransactionResponse = (response: any): response is TransactionResponse => {
    return "wait" in response
}

export function useChai(chai_: Chai.ChaiStatic, utils: Chai.ChaiUtils) {
    supportRevertedWith(chai_.Assertion)
}

function getFirstString(arr: any[]) {
    for (const item of Array.from(arr).reverse()) {
        if (typeof item === "string") {
            return item
        }
    }
    return "[chai]: no log item found" // No string found in the list
}

const COLOR_GREEN = "\x1b[32m"
const COLOR_YELLOW = "\x1b[33m"
const COLOR_RED = "\x1b[31m"
const COLOR_RESET = "\x1b[0m"
const COLOR_CYAN = "\x1b[36m"

export function supportRevertedWith(Assertion: Chai.AssertionStatic) {
    Assertion.addMethod("revertedWith", function (this: any, revertReason: string | RegExp) {
        callPromise(this)
        const strReason = typeof revertReason === "string" ? revertReason : ""
        const assertNotReverted = () =>
            this.assert(
                false,
                `Expected transaction to revert with: "${strReason}"`,
                "Expected transaction NOT to revert",
                "Transaction reverted.",
                "Transaction NOT reverted.",
            )

        const onError = (error: any) => {
            // console.error("Logs", error?.metadata?.logs)
            // console.log("\nRevertresearon:", revertReason)

            const errString = error.toString()

            let revertString = ""
            let logs = error?.metadata?.logs ?? ([] as string[])
            // console.error("Logs", logs)

            if (logs.length > 0) {
                revertString = getFirstString(logs)
            }
            if (errString.includes("ArithmeticOverflow")) {
                revertString = "ArithmeticOverflow"
            }

            const isReverted = revertReason instanceof RegExp ? revertReason.test(revertString) : revertString === revertReason
            this.assert(
                isReverted,
                `Expected revert with ${COLOR_GREEN}"${revertReason}"${COLOR_RED}, but got: ${COLOR_YELLOW}"${revertString}"${COLOR_RED}.

  Logs: ${formatComplexObject(logs)}
`,
                `Expected transaction NOT to be reverted with "${revertReason}"`,
                `Transaction reverted with "${revertReason}"`,
                error,
            )

            return error
        }

        this.callPromise = this.callPromise.then(assertNotReverted, onError)
        this.then = this.callPromise.then.bind(this.callPromise)
        this.catch = this.callPromise.catch.bind(this.callPromise)
        this.txMatcher = "revertedWith"
        return this
    })
}

/**
 * Takes a chai object (usually a `this` object) and adds a `promise` property to it.
 * Adds a `response` property to the chai object with the transaction response.
 * The promised is resolved when the transaction is mined.
 * Adds a `receipt` property to the chai object with the transaction receipt when the promise is resolved.
 * May be called on a chai object which contains any of these:
 * - a transaction response
 * - a promise which resolves to a transaction response
 * - a function that returns a transaction response
 * - a function that returns a promise which resolves to a transaction response
 * - same combinations as above but query instead of transaction.
 *  Attention: some matchers require to be called on a transaction.
 */
export const callPromise = (chaiObj: any) => {
    if ("callPromise" in chaiObj) {
        return
    }

    const call = chaiObj._obj
    let response: MaybePromise<any>

    if (typeof call === "function") {
        response = call()
    } else {
        response = call
    }

    if (!("then" in response)) {
        if (isTransactionResponse(response)) {
            chaiObj.txResponse = response
            chaiObj.callPromise = response.wait().then((txReceipt) => {
                chaiObj.txReceipt = txReceipt
            })
        } else {
            chaiObj.queryResponse = response
            chaiObj.callPromise = Promise.resolve()
        }
    } else {
        chaiObj.callPromise = response.then(async (response: any) => {
            if (isTransactionResponse(response)) {
                chaiObj.txResponse = response
                const txReceipt = await response.wait()
                chaiObj.txReceipt = txReceipt
            } else {
                chaiObj.queryResponse = response
            }
        })
    }

    // Setting `then` and `catch` on the chai object to be compliant with the chai-aspromised library.
    chaiObj.then = chaiObj.callPromise.then.bind(chaiObj.callPromise)
    chaiObj.catch = chaiObj.callPromise.catch.bind(chaiObj.callPromise)
}
