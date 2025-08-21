import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, BigIntColumn as BigIntColumn_, BigDecimalColumn as BigDecimalColumn_, DateTimeColumn as DateTimeColumn_, IntColumn as IntColumn_, StringColumn as StringColumn_, ManyToOne as ManyToOne_, Index as Index_, OneToMany as OneToMany_} from "@subsquid/typeorm-store"
import {PositionStatus} from "./_positionStatus"
import {PositionSide} from "./_positionSide"
import {Account} from "./account.model"
import {Market} from "./market.model"
import {Trade} from "./trade.model"
import {Payment} from "./payment.model"

@Entity_()
export class Position {
    constructor(props?: Partial<Position>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Column_("varchar", {length: 10, nullable: true})
    status!: PositionStatus | undefined | null

    @Column_("varchar", {length: 5, nullable: true})
    side!: PositionSide | undefined | null

    @BigIntColumn_({nullable: true})
    size!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    maxSize!: bigint | undefined | null

    @BigDecimalColumn_({nullable: true})
    entryPrice!: BigDecimal | undefined | null

    @BigDecimalColumn_({nullable: true})
    exitPrice!: BigDecimal | undefined | null

    @BigDecimalColumn_({nullable: true})
    realizedPnl!: BigDecimal | undefined | null

    @DateTimeColumn_({nullable: true})
    createdAt!: Date | undefined | null

    @IntColumn_({nullable: true})
    createdAtHeight!: number | undefined | null

    @BigDecimalColumn_({nullable: true})
    sumOpen!: BigDecimal | undefined | null

    @BigDecimalColumn_({nullable: true})
    sumClose!: BigDecimal | undefined | null

    @BigDecimalColumn_({nullable: true})
    netFunding!: BigDecimal | undefined | null

    @BigDecimalColumn_({nullable: true})
    unrealizedPnl!: BigDecimal | undefined | null

    @DateTimeColumn_({nullable: true})
    closedAt!: Date | undefined | null

    @IntColumn_({nullable: true})
    subaccountNumber!: number | undefined | null

    @StringColumn_({nullable: true})
    ticker!: string | undefined | null

    @BigDecimalColumn_({nullable: true})
    collateral!: BigDecimal | undefined | null

    @BigDecimalColumn_({nullable: true})
    positionFees!: BigDecimal | undefined | null

    @BigDecimalColumn_({nullable: true})
    entryFundingRate!: BigDecimal | undefined | null

    @BigDecimalColumn_({nullable: true})
    reserveAmount!: BigDecimal | undefined | null

    @DateTimeColumn_({nullable: true})
    lastIncreasedTime!: Date | undefined | null

    @Index_()
    @ManyToOne_(() => Account, {nullable: true})
    account!: Account | undefined | null

    @Index_()
    @ManyToOne_(() => Market, {nullable: true})
    market!: Market | undefined | null

    @OneToMany_(() => Trade, e => e.position)
    trades!: Trade[]

    @OneToMany_(() => Payment, e => e.position)
    payments!: Payment[]
}
