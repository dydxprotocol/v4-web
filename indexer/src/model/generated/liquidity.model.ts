import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, Index as Index_, BigIntColumn as BigIntColumn_, IntColumn as IntColumn_, BooleanColumn as BooleanColumn_} from "@subsquid/typeorm-store"

@Entity_()
export class Liquidity {
    constructor(props?: Partial<Liquidity>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @StringColumn_({nullable: false})
    provider!: string

    @BigIntColumn_({nullable: false})
    stable!: bigint

    @BigIntColumn_({nullable: false})
    lpAmount!: bigint

    @BigIntColumn_({nullable: false})
    fee!: bigint

    @IntColumn_({nullable: false})
    timestamp!: number

    @BooleanColumn_({nullable: false})
    latest!: boolean
}
