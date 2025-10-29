import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, Index as Index_, BooleanColumn as BooleanColumn_} from "@subsquid/typeorm-store"

@Entity_()
export class PositionKey {
    constructor(props?: Partial<PositionKey>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @StringColumn_({nullable: false})
    account!: string

    @Index_()
    @StringColumn_({nullable: false})
    indexAssetId!: string

    @BooleanColumn_({nullable: false})
    isLong!: boolean
}
