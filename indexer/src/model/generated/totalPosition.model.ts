import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, Index as Index_, BooleanColumn as BooleanColumn_, BigIntColumn as BigIntColumn_, IntColumn as IntColumn_} from "@subsquid/typeorm-store"

@Entity_()
export class TotalPosition {
    constructor(props?: Partial<TotalPosition>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @StringColumn_({nullable: false})
    indexAssetId!: string

    @BooleanColumn_({nullable: false})
    isLong!: boolean

    @BigIntColumn_({nullable: false})
    collateralAmout!: bigint

    @BigIntColumn_({nullable: false})
    size!: bigint

    @IntColumn_({nullable: false})
    lastTimestamp!: number
}
