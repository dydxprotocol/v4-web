import { getAssetId } from "./asset"

export function getCallParams(fungibleContract: any, amount: number | string) {
    return {
        forward: [amount, getAssetId(fungibleContract)],
    } as any
}
