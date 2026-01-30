#!/usr/bin/env python3
"""Simple trading ledger (CSV) for the ring-fenced bankroll.

Append rows and compute basic stats.

Usage:
  python3 ledger.py init --path ./tmp/binance-ledger.csv
  python3 ledger.py add --path ./tmp/binance-ledger.csv --ts "2026-01-30 19:00" --pair BTCUSDT --side BUY --size_usdt 10 --entry 42000 --stop 41500 --target 43500 --result_usdt 0 --notes "opened"
  python3 ledger.py stats --path ./tmp/binance-ledger.csv
"""

import argparse
import csv
from pathlib import Path

FIELDS = [
    "ts",
    "pair",
    "side",
    "setup",
    "size_usdt",
    "entry",
    "stop",
    "target",
    "result_usdt",
    "notes",
]


def cmd_init(path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        return
    with path.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        w.writeheader()


def cmd_add(path: Path, row: dict):
    cmd_init(path)
    with path.open("a", newline="") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        w.writerow({k: row.get(k, "") for k in FIELDS})


def cmd_stats(path: Path):
    if not path.exists():
        raise SystemExit(f"ledger not found: {path}")
    rows = []
    with path.open() as f:
        r = csv.DictReader(f)
        for row in r:
            rows.append(row)

    def fnum(x):
        try:
            return float(x)
        except Exception:
            return 0.0

    pnl = sum(fnum(r.get("result_usdt")) for r in rows)
    n = len(rows)
    wins = sum(1 for r in rows if fnum(r.get("result_usdt")) > 0)
    losses = sum(1 for r in rows if fnum(r.get("result_usdt")) < 0)

    print(f"Trades: {n}")
    print(f"PnL (USDT): {pnl:.2f}")
    if n:
        print(f"Win rate: {wins}/{n} ({(wins/n)*100:.1f}%)")
        print(f"Losses: {losses}")


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)

    ap_init = sub.add_parser("init")
    ap_init.add_argument("--path", required=True)

    ap_add = sub.add_parser("add")
    ap_add.add_argument("--path", required=True)
    for f in FIELDS:
        if f == "result_usdt":
            ap_add.add_argument(f"--{f}", required=True)
        elif f == "ts":
            ap_add.add_argument(f"--{f}", required=True)
        elif f == "pair":
            ap_add.add_argument(f"--{f}", required=True)
        elif f == "side":
            ap_add.add_argument(f"--{f}", required=True)
        else:
            ap_add.add_argument(f"--{f}", default="")

    ap_stats = sub.add_parser("stats")
    ap_stats.add_argument("--path", required=True)

    args = ap.parse_args()
    path = Path(args.path)

    if args.cmd == "init":
        cmd_init(path)
    elif args.cmd == "add":
        row = {k: getattr(args, k) for k in FIELDS}
        cmd_add(path, row)
    elif args.cmd == "stats":
        cmd_stats(path)


if __name__ == "__main__":
    main()
