export function prank(contract: any, wallet: any) {
    contract.account = wallet
}

export function pranks(contracts: any[], wallet: any) {
    for (const contract of contracts) {
        contract.account = wallet
    }
}

export async function prank_context(contract: any, wallet: any, fn: any) {
    const oldWallet = contract.account
    contract.account = wallet

    await fn()

    contract.account = oldWallet
}
