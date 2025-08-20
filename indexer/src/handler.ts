import {
    assertEquals,
    assertExists,
    assertStrictEquals,
} from "https://deno.land/std@0.203.0/testing/asserts.ts"

type MarketId = string
type UnixSeconds = number
type IntervalSec = number

interface PriceTick {
    marketId: MarketId
    price: number
    timestampSec: UnixSeconds
}
interface Candle {
    marketId: MarketId
    intervalSec: IntervalSec
    openTimeSec: UnixSeconds
    open: number
    high: number
    low: number
    close: number
}
type CandleStore = Map<string, Candle>

const key = (m: MarketId, i: IntervalSec, o: UnixSeconds) =>
    `${m}|${i}|${o}`

const getCandle = (
    store: CandleStore,
    m: MarketId,
    i: IntervalSec,
    o: UnixSeconds,
): Candle | undefined => store.get(key(m, i, o))

const upsertCandle = (store: CandleStore, candle: Candle): void => {
    store.set(key(candle.marketId, candle.intervalSec, candle.openTimeSec), candle)
}

const allCandles = (store: CandleStore): Candle[] =>
    Array.from(store.values()).sort(
        (a, b) =>
            a.marketId.localeCompare(b.marketId) ||
            a.intervalSec - b.intervalSec ||
            a.openTimeSec - b.openTimeSec,
    )

const intervalOpenTime = (ts: UnixSeconds, interval: IntervalSec): UnixSeconds =>
    Math.floor(ts / interval) * interval

const createCandle = (
    tick: PriceTick,
    intervalSec: IntervalSec,
    openTimeSec: UnixSeconds,
): Candle => ({
    marketId: tick.marketId,
    intervalSec,
    openTimeSec,
    open: tick.price,
    high: tick.price,
    low: tick.price,
    close: tick.price,
})

const updateCandle = (candle: Candle, tick: PriceTick): Candle => ({
    ...candle,
    high: Math.max(candle.high, tick.price),
    low: Math.min(candle.low, tick.price),
    close: tick.price,
})

const onTick = (
    store: CandleStore,
    intervals: IntervalSec[],
    tick: PriceTick,
): void => {
    intervals.forEach(interval => {
        debugger;
        const openTime = intervalOpenTime(tick.timestampSec, interval)
        const existing = getCandle(store, tick.marketId, interval, openTime)

        const candle: Candle = existing
            ? updateCandle(existing, tick)
            : createCandle(tick, interval, openTime)

        upsertCandle(store, candle)
    })
}

Deno.test("creates a new candle on first tick", () => {
    const store: CandleStore = new Map()
    const tick: PriceTick = { marketId: "BTC-USD", price: 100, timestampSec: 1002 }
    onTick(store, [60], tick)

    const candle = getCandle(store, "BTC-USD", 60, intervalOpenTime(1002, 60))
    assertExists(candle)
    assertEquals(candle.open, 100)
    assertEquals(candle.high, 100)
    assertEquals(candle.low, 100)
    assertEquals(candle.close, 100)
})

Deno.test("updates high, low, close on subsequent ticks", () => {
    const store: CandleStore = new Map()
    const base = 1000
    const ticks: PriceTick[] = [
        { marketId: "BTC-USD", price: 100, timestampSec: base + 5 },
        { marketId: "BTC-USD", price: 120, timestampSec: base + 15 },
        { marketId: "BTC-USD", price: 90, timestampSec: base + 30 },
        { marketId: "BTC-USD", price: 110, timestampSec: base + 50 },
    ]
    ticks.forEach(t => onTick(store, [60], t))

    const c = getCandle(store, "BTC-USD", 60, intervalOpenTime(base + 5, 60))!
    assertEquals(c.open, 100)
    assertEquals(c.high, 120)
    assertEquals(c.low, 90)
    assertEquals(c.close, 110)
})

Deno.test("creates a new candle when moving to the next interval", () => {
    const store: CandleStore = new Map()
    const base = 2000
    onTick(store, [60], { marketId: "BTC-USD", price: 100, timestampSec: base + 55 })
    onTick(store, [60], { marketId: "BTC-USD", price: 105, timestampSec: base + 65 })

    const c1 = getCandle(store, "BTC-USD", 60, intervalOpenTime(base + 55, 60))!
    const c2 = getCandle(store, "BTC-USD", 60, intervalOpenTime(base + 65, 60))!

    assertStrictEquals(c1.open, 100)
    assertStrictEquals(c2.open, 105)
})

Deno.test("handles multiple intervals simultaneously", () => {
    const store: CandleStore = new Map()
    const base = 3000
    onTick(store, [60, 300], { marketId: "BTC-USD", price: 200, timestampSec: base + 10 })

    const c1m = getCandle(store, "BTC-USD", 60, intervalOpenTime(base + 10, 60))!
    const c5m = getCandle(store, "BTC-USD", 300, intervalOpenTime(base + 10, 300))!

    assertEquals(c1m.intervalSec, 60)
    assertEquals(c5m.intervalSec, 300)
})

Deno.test("multiple markets are independent", () => {
    const store: CandleStore = new Map()
    const base = 4000
    onTick(store, [60], { marketId: "BTC-USD", price: 300, timestampSec: base + 2 })
    onTick(store, [60], { marketId: "ETH-USD", price: 20, timestampSec: base + 2 })

    const btc = getCandle(store, "BTC-USD", 60, intervalOpenTime(base + 2, 60))!
    const eth = getCandle(store, "ETH-USD", 60, intervalOpenTime(base + 2, 60))!

    assertEquals(btc.open, 300)
    assertEquals(eth.open, 20)
})

Deno.test("handles ticks exactly on interval boundary", () => {
    const store: CandleStore = new Map()
    const ts = 5000
    onTick(store, [60], { marketId: "BTC-USD", price: 400, timestampSec: ts })

    const candle = getCandle(store, "BTC-USD", 60, intervalOpenTime(ts, 60))!
    // at boundary, openTime is floored (ts itself if divisible by interval)
    assertEquals(candle.openTimeSec, intervalOpenTime(ts, 60))
})

Deno.test("out-of-order ticks still update high/low/close, but open is first seen", () => {
    const store: CandleStore = new Map()
    const base = 6000
    // later tick comes first
    onTick(store, [60], { marketId: "BTC-USD", price: 120, timestampSec: base + 50 })
    onTick(store, [60], { marketId: "BTC-USD", price: 100, timestampSec: base + 10 })

    const c = getCandle(store, "BTC-USD", 60, intervalOpenTime(base + 10, 60))!
    assertEquals(c.open, 120) // open = first processed
    assertEquals(c.high, 120)
    assertEquals(c.low, 100)
    assertEquals(c.close, 100) // close = last processed
})

Deno.test("allCandles returns sorted list by market, interval, then openTime", () => {
    const store: CandleStore = new Map()
    const base = 7000
    onTick(store, [60], { marketId: "BTC-USD", price: 10, timestampSec: base + 10 })
    onTick(store, [60], { marketId: "BTC-USD", price: 20, timestampSec: base + 70 })
    onTick(store, [60], { marketId: "ETH-USD", price: 5, timestampSec: base + 10 })

    const candles = allCandles(store)
    const ids = candles.map(c => `${c.marketId}:${c.intervalSec}:${c.openTimeSec}`)

    assertEquals(ids, [
        `BTC-USD:60:${intervalOpenTime(base + 10, 60)}`,
        `BTC-USD:60:${intervalOpenTime(base + 70, 60)}`,
        `ETH-USD:60:${intervalOpenTime(base + 10, 60)}`,
    ].sort((a, b) => a.localeCompare(b))) // mimic store's sort
})
