import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, IntColumn as IntColumn_, StringColumn as StringColumn_, BigDecimalColumn as BigDecimalColumn_, BigIntColumn as BigIntColumn_, OneToMany as OneToMany_} from "@subsquid/typeorm-store"
import * as marshal from "./marshal"
import {MarketType} from "./_marketType"
import {MarketStatus} from "./_marketStatus"
import {Position} from "./position.model"
import {Trade} from "./trade.model"
import {Candle} from "./_candle"
import {Payment} from "./payment.model"

@Entity_()
export class Market {
    constructor(props?: Partial<Market>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @IntColumn_({nullable: false})
    atomicResolution!: number

    @StringColumn_({nullable: false})
    baseOpenInterest!: string

    @BigDecimalColumn_({nullable: false})
    defaultFundingRate1H!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    initialMarginFraction!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    maintenanceMarginFraction!: BigDecimal

    @Column_("varchar", {length: 4, nullable: false})
    marketType!: MarketType

    @BigDecimalColumn_({nullable: false})
    nextFundingRate!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    openInterest!: BigDecimal

    @BigDecimalColumn_({nullable: true})
    openInterestLowerCap!: BigDecimal | undefined | null

    @BigDecimalColumn_({nullable: true})
    openInterestUpperCap!: BigDecimal | undefined | null

    @BigDecimalColumn_({nullable: true})
    oraclePrice!: BigDecimal | undefined | null

    @BigDecimalColumn_({nullable: false})
    priceChange24H!: BigDecimal

    @IntColumn_({nullable: false})
    quantumConversionExponent!: number

    @Column_("varchar", {length: 15, nullable: false})
    status!: MarketStatus

    @BigIntColumn_({nullable: false})
    stepBaseQuantums!: bigint

    @BigDecimalColumn_({nullable: false})
    stepSize!: BigDecimal

    @IntColumn_({nullable: false})
    subticksPerTick!: number

    @BigDecimalColumn_({nullable: false})
    tickSize!: BigDecimal

    @StringColumn_({nullable: false})
    ticker!: string

    @BigDecimalColumn_({nullable: false})
    trades24H!: BigDecimal

    @BigDecimalColumn_({nullable: false})
    volume24H!: BigDecimal

    @IntColumn_({nullable: true})
    clobPairId!: number | undefined | null

    @OneToMany_(() => Position, e => e.market)
    positions!: Position[]

    @OneToMany_(() => Trade, e => e.market)
    trades!: Trade[]

    @Column_("jsonb", {transformer: {to: obj => obj == null ? undefined : obj.map((val: any) => val.toJSON()), from: obj => obj == null ? undefined : marshal.fromList(obj, val => new Candle(undefined, marshal.nonNull(val)))}, nullable: true})
    candles!: (Candle)[] | undefined | null

    @OneToMany_(() => Payment, e => e.market)
    payments!: Payment[]
}
