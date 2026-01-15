import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, IntColumn as IntColumn_, BooleanColumn as BooleanColumn_, BigIntColumn as BigIntColumn_, StringColumn as StringColumn_, Index as Index_} from "@subsquid/typeorm-store"

@Entity_()
export class Liquidity {
    constructor(props?: Partial<Liquidity>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @IntColumn_({nullable: false})
    timestamp!: number

    @BooleanColumn_({nullable: false})
    latest!: boolean

    @BigIntColumn_({nullable: false})
    lpAssetBalance!: bigint

    @Index_()
    @StringColumn_({nullable: false})
    account!: string

    @BigIntColumn_({nullable: false})
    baseAsset!: bigint

    @BigIntColumn_({nullable: false})
    lpAsset!: bigint

    @BigIntColumn_({nullable: false})
    fee!: bigint
}
