---
name: binance-trading
description: Create and execute a cautious, rules-based crypto trading workflow on Binance (Spot-first) with browser automation and explicit human approval. Use when planning trades, generating "trade cards" (entry/stop/target/size), reviewing Binance holdings, enforcing risk limits, journaling results, or driving Binance UI via Clawdbot browser relay.
---

# Binance Trading

Run a strict, survival-first trading workflow on Binance using browser relay. Optimize for not blowing up the bankroll; treat every action as irreversible.

## Operating rules (non-negotiable)

- **No autonomous trading.** Always require explicit user approval (YES/NO) before placing any order.
- **Spot-first by default.** Do not use futures/perps unless the user explicitly requests it.
- **15m is for entries only.** Determine bias/levels from higher TFs; use 15m for timing.
- **Ring-fence the bankroll.** Track a dedicated sub-balance (e.g., $100 USDT) separately from the rest of the wallet.
- **Hard stops:**
  - Max risk per trade: **1–2%** of the ring-fenced bankroll.
  - Max loss per day: **~5%** (stop trading once hit).
  - Max open positions: **2**.
  - After **3 consecutive losses**: stop and review.
- **No trades “in the middle.”** Only trade at pre-marked levels (support/resistance, range boundaries) with a defined invalidation.
- **Log everything.** Every proposed trade and outcome must be recorded.

## Workflow

### 1) Connect (browser relay)
1. Use the Chrome relay tab with Binance logged in.
2. Verify you are on `binance.com/en-GB/` and can see wallet/spot trading pages.

### 2) Read the situation (top-down)
1. Select universe: liquid **USDT pairs**. Prefer majors + high-volume large caps; avoid thin books and brand-new listings.
2. Determine regime (4H/1H):
   - **Trend:** higher highs/higher lows (only buys) or lower highs/lower lows (avoid longs).
   - **Range:** clear top/bottom; only trade edges.
3. Mark 2–4 key levels (previous swing high/low, range top/bottom).
4. Drop to **15m** for entry timing only (retest/rejection + candlestick confirmation).

### 3) Choose one setup type (keep it simple)
Prefer one of these:
- **Breakout → retest** (enter on retest; stop beyond the retest swing).
- **Rejection wick at a key level** (enter on confirmation; stop beyond wick).
- **Range edge** (buy bottom / sell top; stop beyond range).
- **Trend pullback continuation** (enter after pullback + confirmation; stop beyond swing).

**Confluence rule (strongly preferred):** for pullbacks, require:
- a clear **support/demand zone**,
- a **Fib retracement ~0.618** of the prior swing (confluence, not magic), and
- a **candlestick confirmation** (e.g., bullish engulfing / morning star / hammer for longs; bearish equivalents for shorts).

(For quick reminders + definitions, read `references/patterns.md`, `references/candlesticks.md`, and `references/15m-momentum.md`.)

### 4) Generate a trade card (proposal)
Create a single trade card, then wait for approval.

Trade Card (template)
- Pair:
- Setup:
- Bias (why):
- Level(s):
- Entry:
- Stop (invalidation):
- Target(s):
- Size (USDT):
- Max loss if stopped:
- Notes (what would cancel this trade?):

Use `scripts/make_trade_card.py` to format/compute sizing (or do it manually if needed).

### 5) Execute (only after YES)
- Place order via Binance Spot UI (or Convert only if user requests; Convert is less controllable).
- Prefer **limit orders** when practical; avoid slippage.
- If Binance supports OCO for the pair, use it to set stop/target; otherwise place stop/TP manually and monitor.

### 6) Journal + review
After execution, append to the journal:
- timestamp, pair, setup, entry/stop/target, size, result, screenshot URL/path if available

Use `scripts/ledger.py` to keep a simple CSV ledger.

## Resources

### scripts/
- `make_trade_card.py`: create a trade card and compute position sizing from bankroll + risk.
- `ledger.py`: append trades to a CSV journal and compute basic stats.

### references/
- `patterns.md`: the only patterns to use (crypto-friendly).
- `risk-policy.md`: default risk limits and when to stop.
