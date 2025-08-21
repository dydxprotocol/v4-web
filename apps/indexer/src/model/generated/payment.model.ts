import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, DateTimeColumn as DateTimeColumn_, IntColumn as IntColumn_, StringColumn as StringColumn_, BigDecimalColumn as BigDecimalColumn_, ManyToOne as ManyToOne_, Index as Index_} from "@subsquid/typeorm-store"
import {PositionSide} from "./_positionSide"
import {PaymentType} from "./_paymentType"
import {Position} from "./position.model"
import {Market} from "./market.model"

@Entity_()
export class Payment {
    constructor(props?: Partial<Payment>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @DateTimeColumn_({nullable: true})
    createdAt!: Date | undefined | null

    @IntColumn_({nullable: true})
    createdAtHeight!: number | undefined | null

    @StringColumn_({nullable: true})
    ticker!: string | undefined | null

    @BigDecimalColumn_({nullable: true})
    oraclePrice!: BigDecimal | undefined | null

    @BigDecimalColumn_({nullable: true})
    size!: BigDecimal | undefined | null

    @Column_("varchar", {length: 5, nullable: true})
    side!: PositionSide | undefined | null

    @BigDecimalColumn_({nullable: true})
    rate!: BigDecimal | undefined | null

    @BigDecimalColumn_({nullable: true})
    payment!: BigDecimal | undefined | null

    @IntColumn_({nullable: true})
    subaccountNumber!: number | undefined | null

    @BigDecimalColumn_({nullable: true})
    fundingIndex!: BigDecimal | undefined | null

    @Column_("varchar", {length: 8, nullable: true})
    type!: PaymentType | undefined | null

    @Index_()
    @ManyToOne_(() => Position, {nullable: true})
    position!: Position | undefined | null

    @Index_()
    @ManyToOne_(() => Market, {nullable: true})
    market!: Market | undefined | null
}
