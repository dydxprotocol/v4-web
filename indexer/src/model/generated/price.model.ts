import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, StringColumn as StringColumn_, IntColumn as IntColumn_, BigIntColumn as BigIntColumn_} from "@subsquid/typeorm-store"

@Index_(["asset", "timestamp"], {unique: false})
@Entity_()
export class Price {
    constructor(props?: Partial<Price>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @StringColumn_({nullable: false})
    asset!: string

    @IntColumn_({nullable: false})
    timestamp!: number

    @BigIntColumn_({nullable: false})
    price!: bigint
}
