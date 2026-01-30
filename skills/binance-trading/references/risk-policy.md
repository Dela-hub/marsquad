# Risk policy (defaults)

Goal: survive first; compound second.

## Bankroll
- Maintain a **ring-fenced bankroll** (e.g., $100 USDT).
- Do not mix with the rest of the wallet in reporting.

## Limits
- Risk per trade: **1–2%** of ring-fenced bankroll.
- Max open positions: **2**.
- Max daily loss: **5%** of ring-fenced bankroll (stop for the day).
- Max consecutive losses: **3** (stop and review).

## Execution rules
- Every trade requires explicit approval: user replies **YES/NO**.
- Prefer Spot. Do not use futures/perps unless explicitly requested.
- Avoid market orders when liquidity is thin; prefer limits.

## Stop definition
A trade must have a clear invalidation level ("If price hits X, I am wrong").

If stop is too far to keep risk within limits, skip.
