import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, Index as Index_, IntColumn as IntColumn_} from "@subsquid/typeorm-store"

@Entity_()
export class Price {
    constructor(props?: Partial<Price>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @StringColumn_({nullable: false})
    asset!: string

    @Index_()
    @IntColumn_({nullable: false})
    timestamp!: number

    @StringColumn_({nullable: false})
    price!: string
}
