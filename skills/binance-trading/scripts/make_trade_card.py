#!/usr/bin/env python3
"""Create a trade card (text) and compute size from bankroll + risk.

This is intentionally simple and conservative.
It does NOT fetch live prices.

Usage:
  python3 make_trade_card.py \
    --pair BTCUSDT \
    --bankroll 100 \
    --risk_pct 1 \
    --entry 42000 \
    --stop 41500 \
    --target 43500 \
    --setup "Breakout retest" \
    --bias "Uptrend + retest" \
    --levels "42000" \
    --notes "Cancel if closes back under 42000" 

Notes:
- For Spot, position size is approximated assuming 1:1 notional exposure.
- Risk is based on stop distance: size_usdt = risk_usdt / (stop_distance / entry)
"""

import argparse
import math


def fmt(n: float) -> str:
    if n is None:
        return ""
    if abs(n) >= 1000:
        return f"{n:,.2f}"
    if abs(n) >= 1:
        return f"{n:.4f}".rstrip('0').rstrip('.')
    return f"{n:.8f}".rstrip('0').rstrip('.')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pair", required=True)
    ap.add_argument("--setup", required=True)
    ap.add_argument("--bias", required=True)
    ap.add_argument("--levels", default="")
    ap.add_argument("--bankroll", type=float, required=True)
    ap.add_argument("--risk_pct", type=float, default=1.0)
    ap.add_argument("--entry", type=float, required=True)
    ap.add_argument("--stop", type=float, required=True)
    ap.add_argument("--target", type=float, required=True)
    ap.add_argument("--notes", default="")
    args = ap.parse_args()

    risk_usdt = args.bankroll * (args.risk_pct / 100.0)
    stop_dist = abs(args.entry - args.stop)
    if args.entry <= 0 or stop_dist <= 0:
        raise SystemExit("entry and stop must be >0 and different")

    # Approx risk per $1 notional is stop_dist/entry
    risk_per_usdt = stop_dist / args.entry
    size_usdt = risk_usdt / risk_per_usdt

    # Cap size to bankroll (spot) unless user wants to use full balance
    size_usdt = min(size_usdt, args.bankroll)

    max_loss = size_usdt * risk_per_usdt

    rr = abs(args.target - args.entry) / stop_dist

    out = []
    out.append("TRADE CARD")
    out.append(f"- Pair: {args.pair}")
    out.append(f"- Setup: {args.setup}")
    out.append(f"- Bias (why): {args.bias}")
    if args.levels:
        out.append(f"- Level(s): {args.levels}")
    out.append(f"- Entry: {fmt(args.entry)}")
    out.append(f"- Stop (invalidation): {fmt(args.stop)}")
    out.append(f"- Target(s): {fmt(args.target)}")
    out.append(f"- Bankroll (ring-fenced): {fmt(args.bankroll)} USDT")
    out.append(f"- Risk: {fmt(args.risk_pct)}% = {fmt(risk_usdt)} USDT")
    out.append(f"- Size (suggested): {fmt(size_usdt)} USDT")
    out.append(f"- Max loss if stopped (approx): {fmt(max_loss)} USDT")
    out.append(f"- R:R (approx): {fmt(rr)}")
    if args.notes:
        out.append(f"- Notes: {args.notes}")

    print("\n".join(out))


if __name__ == "__main__":
    main()
