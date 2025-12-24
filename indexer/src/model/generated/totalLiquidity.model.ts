import { BigIntColumn as BigIntColumn_, Entity as Entity_, IntColumn as IntColumn_, PrimaryColumn as PrimaryColumn_ } from "@subsquid/typeorm-store"

@Entity_()
export class TotalLiquidity {
    constructor(props?: Partial<TotalLiquidity>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @BigIntColumn_({nullable: false})
    stable!: bigint

    @BigIntColumn_({nullable: false})
    lpAmount!: bigint

    @IntColumn_({nullable: false})
    lastTimestamp!: number
}
