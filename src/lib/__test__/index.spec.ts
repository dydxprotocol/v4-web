import { describe, expect, it } from "vitest"
import { StatsigConfig } from '../../constants/abacus'
import { StatSigFlags } from "../../types/statsig"
import abacusStateManager from "../abacus"

describe('setStatsigConfigs', () => {
    it('only sets properties that exist in the kotlin object', () => {
        abacusStateManager.setStatsigConfigs({
            [StatSigFlags.ffEnableEvmSwaps]: true,
            'nonexistent_flag': true,
        })
        expect(StatsigConfig.ff_enable_evm_swaps).toBe(true)
        // @ts-ignore
        expect(StatsigConfig.nonexistent_flag).toBeUndefined()
    })
})
