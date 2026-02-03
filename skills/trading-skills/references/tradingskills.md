# Trading Skills Playbook (Bot Mastery)

This guide summarizes trading concepts found in the provided PDFs and
pattern images. It is educational and meant for systematic study, backtesting,
and simulation.

## 1) Chart Reading Fundamentals

**Candlestick basics**
- Each candlestick shows the open, high, low, and close for a period.
- Hollow/light candles show buying pressure (close > open). Filled/dark candles
  show selling pressure (close < open).
- Large bodies with small wicks show control; small bodies with large wicks
  show indecision.

**Chart types**
- Line chart: useful for finding clean support/resistance zones.
- Bar/candlestick chart: used to confirm entries and price action signals.

## 2) Support & Resistance Zones (S/R)

Key skills from the charting basics and Naked Forex:
- Identify zones as *areas*, not single prices.
- Zones strengthen with age and repeated reactions.
- Use line charts to sketch zones, then switch back to candles.
- A breakout through a zone is a strong signal; a retouch can confirm it.

Bot tasks:
- Detect swing highs/lows.
- Cluster recent swing points into zones.
- Track zone “age” (time since last test).

## 3) Supply & Demand (S&D) Zones

From Shadowcodes (Hanzo):
- **Supply Zone**: sell area where price previously dropped strongly.
- **Demand Zone**: buy area where price previously rallied strongly.
- Five rules: look left, sell at supply, buy at demand, always use stop loss,
  never forget rules 1–4.

**Base types**
- **DBD (Drop-Base-Drop)**: supply zone (continuation).
- **RBR (Rally-Base-Rally)**: demand zone (continuation).
- **RBD (Rally-Base-Drop)**: supply zone (reversal).
- **DBR (Drop-Base-Rally)**: demand zone (reversal).

**Base quality checks**
- Prefer strong rally/drop before the base.
- Shorter time in base = fresher zone.
- Long, choppy bases are lower quality.

## 4) Market Structure & Trend Context

From Shadowcodes:
- Market structure = uptrend, downtrend, or sideways.
- Trend context guides which zones/patterns are higher probability.

Key skills:
- Detect higher highs/higher lows for uptrends.
- Detect lower highs/lower lows for downtrends.
- Flag sideways ranges for breakout/mean-reversion setups.

## 5) Major Chart Patterns (from images)

Reversal patterns:
- Double Top / Double Bottom
- Head and Shoulders / Inverse Head and Shoulders

Continuation patterns:
- Rising Wedge (bearish), Falling Wedge (bullish)
- Bullish/Bearish Rectangle
- Bullish/Bearish Pennant

Bot tasks:
- Detect converging trendlines (wedges/pennants).
- Confirm neckline breaks for H&S patterns.
- Measure height of pattern for target projection.

## 6) Candlestick Setups (Cheat Sheet)

Bullish formations:
- Bullish Shooting Star (inverted-hammer style)
- Bullish Morning Star
- Bullish Engulfing Candle
- Bullish Piercing Line
- Bullish Tweezer Bottom

Bearish formations:
- Bearish Shooting Star
- Bearish Evening Star
- Bearish Engulfing Candle
- Bearish Dark Cloud Cover
- Bearish Tweezer Top

Bot tasks:
- Pattern recognition on candle sequences.
- Ensure patterns align with trend context and zones.

## 7) Naked Forex Catalysts

**Big Shadow**
- Two-candle reversal where the second candle dwarfs the first.
- Only valid when it prints on a zone.
- Stop loss placed beyond the big-shadow candle.

**Kangaroo Tail**
- Single-candle reversal with a long tail and small body.
- Open/close near the extreme end of the candle.
- Only valid when it prints on a zone.

**Big Belt**
- Rare, large weekly-opening candle on a zone.
- Often appears at major turning points.

## 8) Breakouts, Fake-outs, and “Last Kiss”

From Naked Forex:
- **Fake-out**: price breaks a consolidation zone then returns inside.
- **Last Kiss**: price breaks out, then retouches the zone from the other side
  before continuing the breakout.

Bot tasks:
- Define consolidation boxes (tight ranges with multiple touches).
- Confirm breakout by candle close beyond zone.
- Wait for retouch entry to avoid fake-outs.

## 9) Manipulation & QM Level

From Shadowcodes:
- **Quasimodo (QM)**: pattern similar to H&S but with an engulf (liquidity grab).
- **QM Level (QML)**: a high-liquidity line where stop losses cluster.
- Institutional manipulation often targets these stops before reversals.

Bot tasks:
- Identify QM structure (high, low, fakeout high/low).
- Tag likely liquidity pools at recent swing highs/lows.

## 10) Shadowcodes Types (1–7)

Shadowcodes are shadow-based patterns used for low-risk entries:
- **ST1**: adjacent candles with both high/low shadows (QM/HNS/SRF aid).
- **ST2**: lower shadow on open/close (low-risk entry).
- **ST3**: symmetric side shadows with longer central shadow (ST1 confirmation).
- **ST4**: QM shadow, similar to ST1 but not adjacent candles.
- **ST5**: shadow form of HLZ; often aligns with SRF/Doji/FTR.
- **ST6**: fakeout-style shadow near S&D base.
- **ST7**: compression-style shadow near news-driven moves.

Bot tasks:
- Detect shadow geometry and relative lengths.
- Align shadowcodes with zones and market structure.

## 11) Risk, Stops, and Trade Management

Core rules emphasized across sources:
- Always use a stop loss.
- Place stops beyond the signal candle or beyond the zone boundary.
- Favor larger rewards than risk (R:R > 1).
- Avoid low-quality bases or patterns without clear zones.

## 12) Bot Mastery Checklist

**Data & context**
- Multi-timeframe zones and structure (HTF trend, LTF entry).
- Volatility filters (avoid tiny ranges or overly chaotic candles).

**Signal validation**
- Require a zone or structure context before candle signals.
- Combine at least two signals (e.g., zone + candlestick pattern).

**Execution logic**
- Entry after confirmation (break, retouch, or trigger candle).
- Stop beyond structure or signal candle.
- Target at next zone or measured move.

**Review loop**
- Backtest each setup separately.
- Track win rate, average R, and drawdown per setup.

## 13) Suggested Setup Catalog (for bot toggles)

- S&D zone entries (DBD/RBR/RBD/DBR)
- QM/QML reversals
- H&S / Inverse H&S
- Double Top / Double Bottom
- Wedges / Pennants / Rectangles
- Candlestick reversals (engulfing, stars, tweezers, piercing/dark cloud)
- Naked Forex catalysts (big shadow, kangaroo tail, big belt)
- Breakout + Last-Kiss retouch
- Shadowcodes ST1–ST7

---

If you want, I can turn this into a structured JSON schema for your bot
or add detection rules with thresholds per setup.

## 14) Detection Rules (Bot-Ready)

Use these as default heuristics; tune per instrument/timeframe.

**Zones & structure**
- Zone detection: cluster swing highs/lows within 0.25–0.75 ATR into bands.
- Zone age: rank by number of touches and time since last touch.
- Trend: uptrend if last 3 swing highs/lows are rising; downtrend if falling.

**Supply/Demand bases**
- Base size: 1–6 candles with overlapping bodies.
- Freshness: invalidate if price returns after >2 tests or >50 candles.
- Quality: require departure move >1.5 ATR within 3 candles.

**Candlestick patterns**
- Engulfing: candle 2 body fully engulfs candle 1 body; direction aligns with
  trend or zone reversal.
- Morning/Evening Star: 3-candle pattern with small middle candle (body <50%
  of candle 1), candle 3 closes beyond mid of candle 1.
- Tweezer: two consecutive candles with equal/near-equal highs/lows
  (within 0.2 ATR).
- Piercing/Dark Cloud: candle 2 closes beyond 60% of candle 1 body.

**Naked Forex catalysts**
- Big Shadow: candle 2 range >1.5× candle 1; candle 2 range > max of prior
  5 candles; must print on zone.
- Kangaroo Tail: tail >2× body; open/close in top/bottom third; must print
  on zone; prior candle range contains tail base.
- Big Belt: weekly open gaps beyond prior close by >0.75 ATR and closes near
  opposite extreme; must print on zone.

**Breakouts & Last Kiss**
- Consolidation box: range <2 ATR over 10–30 candles with ≥3 touches each side.
- Breakout: close beyond box by >0.25 ATR.
- Last Kiss: retouch of broken boundary within 3–10 candles; entry on rejection.

**Chart patterns**
- H&S: left shoulder, head, right shoulder with neckline slope <15°;
  breakout on close beyond neckline by >0.2 ATR.
- Double top/bottom: two peaks/troughs within 0.3 ATR of each other; trigger
  on neckline break.
- Wedges/pennants: converging trendlines; breakout direction opposite wedge
  slope for rising/falling wedge.
- Rectangles: flat top/bottom with ≥3 touches each side.

**Shadowcodes**
- ST1: adjacent candles both show upper+lower shadows >50% of body.
- ST2: long lower shadow (≥2× body) on demand; long upper shadow on supply.
- ST3: symmetric side shadows with central long shadow ≥2× side shadows.
- ST4: non-adjacent ST1 alignment within 5–15 candles.
- ST5: HLZ shadow aligned with SRF/Doji/FTR in same zone.
- ST6: shadow fakeout beyond zone then close back inside.
- ST7: compression shadows (shrinking ranges) before news-driven break.

## 15) JSON Schema Blueprint (Bot Config)

Use this as a base config for your bot to toggle setups and thresholds.

```json
{
  "version": "1.0",
  "markets": ["FX", "Crypto", "Indices"],
  "timeframes": ["W", "D", "H4", "H1", "M15"],
  "risk": {
    "maxRiskPerTradePct": 1.0,
    "minRR": 1.5,
    "useStopLoss": true
  },
  "zones": {
    "clusterAtrMin": 0.25,
    "clusterAtrMax": 0.75,
    "minTouches": 2,
    "maxTouches": 4,
    "breakoutCloseAtr": 0.25
  },
  "marketStructure": {
    "swingLookback": 20,
    "trendSwingCount": 3
  },
  "setups": {
    "supplyDemand": {
      "enabled": true,
      "baseCandlesMin": 1,
      "baseCandlesMax": 6,
      "departureAtr": 1.5,
      "maxRetests": 2
    },
    "candlesticks": {
      "enabled": true,
      "engulfing": {"bodyEngulf": true},
      "morningEveningStar": {"midBodyPct": 0.5, "closeBeyondMid": true},
      "tweezer": {"atrTolerance": 0.2},
      "piercingDarkCloud": {"penetrationPct": 0.6}
    },
    "nakedForex": {
      "enabled": true,
      "bigShadow": {"rangeMult": 1.5, "priorRangeLookback": 5},
      "kangarooTail": {"tailBodyRatio": 2.0, "extremeThird": true},
      "bigBelt": {"weeklyGapAtr": 0.75}
    },
    "breakoutLastKiss": {
      "enabled": true,
      "boxAtrMax": 2.0,
      "boxCandlesMin": 10,
      "boxCandlesMax": 30,
      "minTouchesEachSide": 3,
      "retouchCandlesMin": 3,
      "retouchCandlesMax": 10
    },
    "patterns": {
      "enabled": true,
      "headAndShoulders": {"necklineSlopeDegMax": 15, "breakoutAtr": 0.2},
      "doubleTopBottom": {"peakAtrTolerance": 0.3},
      "wedges": {"breakoutAtr": 0.2},
      "rectangles": {"minTouches": 3}
    },
    "shadowcodes": {
      "enabled": true,
      "st1ShadowBodyRatio": 0.5,
      "st2TailBodyRatio": 2.0,
      "st3CenterShadowRatio": 2.0,
      "st4LookbackMin": 5,
      "st4LookbackMax":  15
    }
  },
  "execution": {
    "entry": "confirm",
    "stopPlacement": "beyondSignalOrZone",
    "targets": "nextZoneOrMeasuredMove"
  },
  "logging": {
    "trackWinRate": true,
    "trackAvgR": true,
    "trackDrawdown": true
  }
}
```
