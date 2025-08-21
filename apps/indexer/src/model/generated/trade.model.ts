import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, IntColumn as IntColumn_, DateTimeColumn as DateTimeColumn_, BigDecimalColumn as BigDecimalColumn_, ManyToOne as ManyToOne_, Index as Index_} from "@subsquid/typeorm-store"
import {OrderSide} from "./_orderSide"
import {TradeType} from "./_tradeType"
import {Market} from "./market.model"
import {Position} from "./position.model"

@Entity_()
export class Trade {
    constructor(props?: Partial<Trade>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @IntColumn_({nullable: false})
    createdAtHeight!: number

    @DateTimeColumn_({nullable: true})
    createdAt!: Date | undefined | null

    @Column_("varchar", {length: 4, nullable: true})
    side!: OrderSide | undefined | null

    @BigDecimalColumn_({nullable: true})
    price!: BigDecimal | undefined | null

    @BigDecimalColumn_({nullable: true})
    size!: BigDecimal | undefined | null

    @Column_("varchar", {length: 11, nullable: true})
    tradeType!: TradeType | undefined | null

    @Index_()
    @ManyToOne_(() => Market, {nullable: true})
    market!: Market | undefined | null

    @Index_()
    @ManyToOne_(() => Position, {nullable: true})
    position!: Position | undefined | null
}
