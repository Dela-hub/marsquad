# Engulfing Pattern Spotting (Training + Rules)

Goal: reliably *spot* bullish/bearish engulfing candles and distinguish high-signal (contextual) engulfings from noise.

## 1) Strict Definitions (start here)

Use the **real body** (open↔close), not the wicks.

### Bullish Engulfing (strict)
Candle 1 is bearish and Candle 2 is bullish, and Candle 2 body engulfs Candle 1 body:

- `close2 > open2` (bull candle)
- `close1 < open1` (bear candle)
- `open2 < close1` AND `close2 > open1`

### Bearish Engulfing (strict)
Candle 1 is bullish and Candle 2 is bearish, and Candle 2 body engulfs Candle 1 body:

- `close2 < open2` (bear candle)
- `close1 > open1` (bull candle)
- `open2 > close1` AND `close2 < open1`

## 2) Fast Spotting Heuristic (3-second scan)

For the last ~20 candles:
1) Find a candle with an **obviously larger real body** than the candle before it.
2) Check only open/close: does Candle 2’s body **wrap** Candle 1’s body?
3) If yes → engulfing.

This reduces false positives and trains pattern recognition.

## 3) Quality Filters (to avoid “engulfing but irrelevant”)

Label engulfings as:

### A) Contextual (high signal)
Count as “trade-grade” only if at least **2** of these are true:
- At/near **support/resistance** zone
- At/near **S/D** demand/supply base
- At/near **Fib 61.8 or 38.2** (from a clear swing)
- Prints as HL at support (bullish) or LH at resistance (bearish)
- After a clear impulse and pullback (not mid-chop)

### B) Mid-range (noise)
If it prints in the middle of a range or during messy chop → record it, but do not trade it.

## 4) Training Drill (10 minutes/day)

1) Pick 1 timeframe (recommend **1H**).
2) Choose 5 random tickers.
3) For each ticker, scan the last 50 candles and do rapid **yes/no** calls using strict rules.
4) For each engulfing found, add a tag:
   - `contextual` or `noise`
   - `zone` / `fib` / `HL-LH` / `impulse-pullback`

After 3–5 days you’ll spot them almost instantly.

## 5) Bot-ready Detection Rule (default)

### Engulfing event
- Bullish engulfing event if:
  - `close2 > open2` AND `close1 < open1`
  - `open2 <= close1 + tol` AND `close2 >= open1 - tol`

- Bearish engulfing event if:
  - `close2 < open2` AND `close1 > open1`
  - `open2 >= close1 - tol` AND `close2 <= open1 + tol`

Where `tol` is a small tolerance (suggest: `tol = 0.05 * ATR(14)` or instrument-specific tick size).

### Context score (optional)
Add +1 for each of: zone, fib(61.8/38.2), HL/LH alignment, impulse→pullback.
Treat as signal only if score ≥2.
