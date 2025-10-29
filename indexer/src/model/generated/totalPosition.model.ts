import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, Index as Index_, BooleanColumn as BooleanColumn_, IntColumn as IntColumn_} from "@subsquid/typeorm-store"

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

    @StringColumn_({nullable: false})
    collateralAmout!: string

    @StringColumn_({nullable: false})
    size!: string

    @IntColumn_({nullable: false})
    lastTimestamp!: number
}
