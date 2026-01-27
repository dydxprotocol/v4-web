import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_, IntColumn as IntColumn_, StringColumn as StringColumn_, BooleanColumn as BooleanColumn_, BigIntColumn as BigIntColumn_} from "@subsquid/typeorm-store"
import {PositionKey} from "./positionKey.model.js"
import {PositionChange} from "./_positionChange.js"

@Entity_()
export class Position {
    constructor(props?: Partial<Position>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @StringColumn_({nullable: false})
    openId!: string

    @Index_()
    @ManyToOne_(() => PositionKey, {nullable: true})
    positionKey!: PositionKey

    @Column_("varchar", {length: 9, nullable: false})
    change!: PositionChange

    @IntColumn_({nullable: false})
    timestamp!: number

    @BooleanColumn_({nullable: false})
    latest!: boolean

    @BigIntColumn_({nullable: false})
    collateral!: bigint

    @BigIntColumn_({nullable: false})
    size!: bigint

    @BigIntColumn_({nullable: false})
    price!: bigint

    @BigIntColumn_({nullable: false})
    outAveragePrice!: bigint

    @BigIntColumn_({nullable: false})
    realizedFundingRate!: bigint

    @BigIntColumn_({nullable: false})
    realizedPnl!: bigint

    @BigIntColumn_({nullable: false})
    collateralDelta!: bigint

    @BigIntColumn_({nullable: false})
    sizeDelta!: bigint

    @BigIntColumn_({nullable: false})
    outLiquidityFee!: bigint

    @BigIntColumn_({nullable: false})
    outProtocolFee!: bigint

    @BigIntColumn_({nullable: false})
    outLiquidationFee!: bigint

    @BigIntColumn_({nullable: false})
    fundingRate!: bigint

    @BigIntColumn_({nullable: false})
    outFundingRate!: bigint

    @BigIntColumn_({nullable: false})
    pnlDelta!: bigint

    @BigIntColumn_({nullable: false})
    outPnlDelta!: bigint

    @BigIntColumn_({nullable: false})
    outAmount!: bigint
}
