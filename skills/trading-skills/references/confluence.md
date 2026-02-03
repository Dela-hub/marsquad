# Trading Confluence Checklist (All-Confirm Model)

This file defines a strict, all-categories-confirmation model for a single
stock ticker. A trade signal is valid only when every category below aligns.

## Ticker Input (Bot Prompt)

At runtime, the bot should prompt:

```
Enter ticker to scan: <TICKER>
```

All checks below are performed for that ticker only.

## Timeframe Correlation Logic

Define five timeframes per market (top-down):
- **W (Weekly)**: macro trend + major zones.
- **D (Daily)**: primary structure + key SR/S&D.
- **H4 (4H)**: structure confirmation + pattern context.
- **H1 (1H)**: pre-entry alignment + catalyst setup.
- **M5 (5m)**: execution trigger and precise entry.

**Directional bias rules**
- **Weekly/Daily wick at resistance** (long upper wick rejecting supply/SR)
  sets **bearish bias** on all lower timeframes.
- **Weekly/Daily wick at support** (long lower wick rejecting demand/SR)
  sets **bullish bias** on all lower timeframes.
- All higher timeframes (W/D/H4/H1) must align with the M5 direction.
- If any higher timeframe conflicts, **no trade** on M5.
- If HTF has no clear wick rejection at a zone, **no trade**.

## All-Confirm Entry Requirements

Every category must confirm on the same ticker and aligned direction.

### 1) Market Structure (W + D + H4 + H1)
- **Buy**: W/D/H4/H1 show higher highs/higher lows, and M5 prints a **higher low** into support.
- **Sell**: W/D/H4/H1 show lower highs/lower lows, and M5 prints a **lower low** into resistance.
- If structure conflicts across any timeframe, **no trade**.

### 2) Support/Resistance Zones (HTF)
- Entry must occur **at or near** a validated SR zone.
- Zone must have ≥2 historical reactions and remain unbroken.

### 3) Supply/Demand Zones (HTF)
- **Buy**: price is reacting at a valid **demand** zone.
- **Sell**: price is reacting at a valid **supply** zone.
- Base must be 1–6 candles, with a strong departure move.

### 4) Chart Patterns (H4 or H1)
Valid patterns must align with bias:
- Reversal: double bottom/top, inverse/regular H&S.
- Continuation: wedges, rectangles, pennants.
- Breakout confirmation requires candle close beyond pattern boundary.

### 5) Candlestick Setups (M5)
Must trigger at the active zone and align with bias:
- Bullish: engulfing, morning star, piercing line, tweezer bottom.
- Bearish: engulfing, evening star, dark cloud, tweezer top.

### 6) Naked Forex Catalysts (M5)
One catalyst must confirm the entry:
- Big Shadow
- Kangaroo Tail
- Big Belt (rare, but valid)

### 7) Breakouts, Fake-outs, Last Kiss (M5)
- If entry is breakout-based, a valid **Last Kiss** retouch must occur.
- Fake-out detection invalidates the trade.

## Signal Output Logic

### Buy Signal (All Confirm)
Trigger **BUY = TRUE** only when:
1) HTF wick rejection at support/demand (bullish bias).
2) W/D/H4/H1 structure bullish and M5 forms a **higher low** at support.
3) HTF SR + demand zone confluence at price.
4) H4/H1 pattern confirms bullish direction.
5) M5 candlestick setup confirms bullish entry.
6) M5 Naked Forex catalyst present.
7) M5 breakout/last-kiss rules confirm, no fake-out.

### Sell Signal (All Confirm)
Trigger **SELL = TRUE** only when:
1) HTF wick rejection at resistance/supply (bearish bias).
2) W/D/H4/H1 structure bearish and M5 forms a **lower low** at resistance.
3) HTF SR + supply zone confluence at price.
4) H4/H1 pattern confirms bearish direction.
5) M5 candlestick setup confirms bearish entry.
6) M5 Naked Forex catalyst present.
7) M5 breakout/last-kiss rules confirm, no fake-out.

### No-Trade Conditions
- Missing any category confirmation.
- HTF bias unclear or conflicts with MTF/LTF direction.
- Pattern/candlestick/catalyst not occurring at a valid zone.
- Breakout without a valid retouch (Last Kiss).

## Execution Notes
- Entry should occur only after **all checks** are true.
- Stop should be placed beyond the signal candle or zone boundary.
- Target should be next HTF zone or measured-move projection.
