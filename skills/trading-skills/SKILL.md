---
name: trading-skills
description: Trading strategy playbook + bot-signal heuristics for S/R, supply/demand, market structure, chart patterns, candlestick setups, Naked Forex catalysts (big shadow, kangaroo tail, big belt), breakouts/fakeouts/Last Kiss, Quasimodo/QML, and Shadowcodes ST1–ST7. Use when designing, documenting, tuning, or validating rule-based trading signals, creating a setup catalog, translating discretionary patterns into detection rules, generating bot config/JSON schemas, or reviewing trade-management/risk rules.
---

# Trading Skills (Playbook → Bot Rules)

## Quick use
- For the full playbook and the bot-ready heuristics + JSON blueprint, read: `references/tradingskills.md`.

## Workflow
1) Ask for market(s), instrument(s), and timeframes.
2) Pick 1–3 setups to focus on (avoid enabling everything at once).
3) Translate into *explicit* detection rules (thresholds, lookbacks, ATR multipliers).
4) Define execution policy (confirm/limit, stop placement, targets, invalidation).
5) Define evaluation metrics (win rate, avg R, drawdown) and backtest plan.

## Guardrails
- Keep it educational; avoid giving guaranteed-profit claims.
- Prefer smaller setup catalogs with clear logging over “kitchen sink” strategies.
