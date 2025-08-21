import {BigDecimal} from "@subsquid/big-decimal"
import assert from "assert"
import * as marshal from "./marshal"
import {CandleResolution} from "./_candleResolution"
import {Market} from "./market.model"

export class Candle {
    private _id!: string
    private _ticker!: string | undefined | null
    private _resolution!: CandleResolution | undefined | null
    private _startedAt!: Date | undefined | null
    private _open!: BigDecimal | undefined | null
    private _close!: BigDecimal | undefined | null
    private _high!: BigDecimal | undefined | null
    private _low!: BigDecimal | undefined | null
    private _baseTokenVolume!: BigDecimal | undefined | null
    private _usdVolume!: BigDecimal | undefined | null
    private _startingOpenInterest!: BigDecimal | undefined | null
    private _market!: string | undefined | null

    constructor(props?: Partial<Omit<Candle, 'toJSON'>>, json?: any) {
        Object.assign(this, props)
        if (json != null) {
            this._id = marshal.id.fromJSON(json.id)
            this._ticker = json.ticker == null ? undefined : marshal.string.fromJSON(json.ticker)
            this._resolution = json.resolution == null ? undefined : marshal.enumFromJson(json.resolution, CandleResolution)
            this._startedAt = json.startedAt == null ? undefined : marshal.datetime.fromJSON(json.startedAt)
            this._open = json.open == null ? undefined : marshal.bigdecimal.fromJSON(json.open)
            this._close = json.close == null ? undefined : marshal.bigdecimal.fromJSON(json.close)
            this._high = json.high == null ? undefined : marshal.bigdecimal.fromJSON(json.high)
            this._low = json.low == null ? undefined : marshal.bigdecimal.fromJSON(json.low)
            this._baseTokenVolume = json.baseTokenVolume == null ? undefined : marshal.bigdecimal.fromJSON(json.baseTokenVolume)
            this._usdVolume = json.usdVolume == null ? undefined : marshal.bigdecimal.fromJSON(json.usdVolume)
            this._startingOpenInterest = json.startingOpenInterest == null ? undefined : marshal.bigdecimal.fromJSON(json.startingOpenInterest)
            this._market = json.market == null ? undefined : marshal.string.fromJSON(json.market)
        }
    }

    get id(): string {
        assert(this._id != null, 'uninitialized access')
        return this._id
    }

    set id(value: string) {
        this._id = value
    }

    get ticker(): string | undefined | null {
        return this._ticker
    }

    set ticker(value: string | undefined | null) {
        this._ticker = value
    }

    get resolution(): CandleResolution | undefined | null {
        return this._resolution
    }

    set resolution(value: CandleResolution | undefined | null) {
        this._resolution = value
    }

    get startedAt(): Date | undefined | null {
        return this._startedAt
    }

    set startedAt(value: Date | undefined | null) {
        this._startedAt = value
    }

    get open(): BigDecimal | undefined | null {
        return this._open
    }

    set open(value: BigDecimal | undefined | null) {
        this._open = value
    }

    get close(): BigDecimal | undefined | null {
        return this._close
    }

    set close(value: BigDecimal | undefined | null) {
        this._close = value
    }

    get high(): BigDecimal | undefined | null {
        return this._high
    }

    set high(value: BigDecimal | undefined | null) {
        this._high = value
    }

    get low(): BigDecimal | undefined | null {
        return this._low
    }

    set low(value: BigDecimal | undefined | null) {
        this._low = value
    }

    get baseTokenVolume(): BigDecimal | undefined | null {
        return this._baseTokenVolume
    }

    set baseTokenVolume(value: BigDecimal | undefined | null) {
        this._baseTokenVolume = value
    }

    get usdVolume(): BigDecimal | undefined | null {
        return this._usdVolume
    }

    set usdVolume(value: BigDecimal | undefined | null) {
        this._usdVolume = value
    }

    get startingOpenInterest(): BigDecimal | undefined | null {
        return this._startingOpenInterest
    }

    set startingOpenInterest(value: BigDecimal | undefined | null) {
        this._startingOpenInterest = value
    }

    get market(): string | undefined | null {
        return this._market
    }

    set market(value: string | undefined | null) {
        this._market = value
    }

    toJSON(): object {
        return {
            id: this.id,
            ticker: this.ticker,
            resolution: this.resolution,
            startedAt: this.startedAt == null ? undefined : marshal.datetime.toJSON(this.startedAt),
            open: this.open == null ? undefined : marshal.bigdecimal.toJSON(this.open),
            close: this.close == null ? undefined : marshal.bigdecimal.toJSON(this.close),
            high: this.high == null ? undefined : marshal.bigdecimal.toJSON(this.high),
            low: this.low == null ? undefined : marshal.bigdecimal.toJSON(this.low),
            baseTokenVolume: this.baseTokenVolume == null ? undefined : marshal.bigdecimal.toJSON(this.baseTokenVolume),
            usdVolume: this.usdVolume == null ? undefined : marshal.bigdecimal.toJSON(this.usdVolume),
            startingOpenInterest: this.startingOpenInterest == null ? undefined : marshal.bigdecimal.toJSON(this.startingOpenInterest),
            market: this.market,
        }
    }
}
