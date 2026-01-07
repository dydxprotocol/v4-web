import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, BigIntColumn as BigIntColumn_, IntColumn as IntColumn_} from "@subsquid/typeorm-store"

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
