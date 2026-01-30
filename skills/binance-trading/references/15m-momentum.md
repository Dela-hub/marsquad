# 15m momentum module (Spot)

Goal: take *fast* trades while avoiding noise.

## Use 15m for entries only
- Bias + key levels come from **4H/1H**.
- 15m is only to time the entry and tighten invalidation.

## When to trade
- Volatility present (15m candles not tiny).
- Price is at/near a pre-marked level.
- Market is not in the middle of a messy range.

## Allowed entry patterns on 15m

### A) Breakout → retest (15m)
- 1H/4H level breaks.
- 15m retest holds (rejection wick / bullish candle).
- Enter on/after confirmation.

### B) Pullback continuation (15m)
- 1H trend intact.
- Pullback into demand + (preferred) Fib ~0.618.
- 15m prints bullish confirmation (engulfing/hammer/morning star style).

### C) Range edge tap (15m)
- Only if 1H range is obvious.
- Enter on rejection at range edge.

## Hard “no trade” filters
- 15m signal conflicts with 1H structure.
- Confirmation candle is huge (stop distance too wide).
- No clean invalidation.
- You feel the urge to “make it back” → stop.

## Position sizing
- Still risk **1–2%** of the ring-fenced bankroll.
- Do NOT increase size just because you won 1–2 trades.
- Scale only after a meaningful sample (e.g., 20+ trades) and only modestly.
