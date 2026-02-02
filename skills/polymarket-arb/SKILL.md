---
name: polymarket-arb
description: Scan Polymarket for simple single-market YES/NO arbitrage opportunities using Gamma (market metadata) + CLOB (order books). Produces WhatsApp-ready, approval-gated trade cards.
---

# Polymarket Arbitrage (MVP)

This skill is the **MVP arb scanner**: start with single-market YES/NO arbitrage using *executable* prices (order book depth) and produce **trade cards**.

## What it does

- Fetch market metadata from **Gamma API** (to discover markets + token ids)
- Fetch order books from **Polymarket CLOB**
- Compute a conservative **buy-both** edge (YES ask + NO ask vs 1.00)
- Output a WhatsApp-friendly trade card

## Run

```bash
node skills/polymarket-arb/scripts/snapshot.mjs
```

## Config (env)

- `POLY_GAMMA_URL` (default: `https://gamma-api.polymarket.com`)
- `POLY_CLOB_URL` (default: `https://clob.polymarket.com`)
- `TOP_MARKETS` (default: `50`)
- `EDGE_THRESHOLD` (default: `0.05`)  # minimum edge to alert
- `MIN_LIQUIDITY_USD` (default: `50`) # minimum depth per leg at the computed executable price

TLS / network:
- If your machine has broken TLS trust store, set `POLY_INSECURE_TLS=1` (not recommended).
- If your network blocks Polymarket (e.g., OpenDNS), you must run this from a network that allows those domains.

## Output

- Human-readable **trade card**
- JSON block for programmatic use

## Safety rules

- **Never auto-execute trades.** This skill only suggests.
- Always show: market, YES/NO prices used, size cap, estimated edge, and a plain-English warning about non-atomic fills.
- If data is blocked/unavailable, output a clear **NO SIGNAL** card with diagnostics.
