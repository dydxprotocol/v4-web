import { BigIntColumn as BigIntColumn_, BooleanColumn as BooleanColumn_, Column as Column_, Entity as Entity_, Index as Index_, IntColumn as IntColumn_, ManyToOne as ManyToOne_, PrimaryColumn as PrimaryColumn_ } from "@subsquid/typeorm-store"
import { PositionChange } from "./_positionChange.js"
import { PositionKey } from "./positionKey.model.js"

@Entity_()
export class Position {
    constructor(props?: Partial<Position>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @ManyToOne_(() => PositionKey, {nullable: true})
    positionKey!: PositionKey

    @BigIntColumn_({nullable: false})
    collateralAmount!: bigint

    @BigIntColumn_({nullable: false})
    size!: bigint

    @IntColumn_({nullable: false})
    timestamp!: number

    @BooleanColumn_({nullable: false})
    latest!: boolean

    @Column_("varchar", {length: 9, nullable: false})
    change!: PositionChange

    @BigIntColumn_({nullable: false})
    collateralTransferred!: bigint

    @BigIntColumn_({nullable: false})
    positionFee!: bigint

    @BigIntColumn_({nullable: false})
    fundingRate!: bigint

    @BigIntColumn_({nullable: false})
    pnlDelta!: bigint

    @BigIntColumn_({nullable: false})
    realizedFundingRate!: bigint

    @BigIntColumn_({nullable: false})
    realizedPnl!: bigint
}
