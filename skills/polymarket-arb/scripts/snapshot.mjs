#!/usr/bin/env node
/**
 * Polymarket arb MVP (single-market YES/NO)
 *
 * Notes:
 * - Uses Gamma for market metadata (including token ids when available)
 * - Uses CLOB /book?token_id= for order books
 * - Produces approval-gated trade cards (no auto-trading)
 */

import process from 'node:process';

function env(name, def) {
  const v = process.env[name];
  return (v === undefined || v === '') ? def : v;
}

const GAMMA_URL = env('POLY_GAMMA_URL', 'https://gamma-api.polymarket.com');
const CLOB_URL = env('POLY_CLOB_URL', 'https://clob.polymarket.com');
const TOP_MARKETS = Number(env('TOP_MARKETS', '50'));
const EDGE_THRESHOLD = Number(env('EDGE_THRESHOLD', '0.05'));
const MIN_LIQUIDITY_USD = Number(env('MIN_LIQUIDITY_USD', '50'));

if (env('POLY_INSECURE_TLS', '') === '1') {
  // eslint-disable-next-line no-warning-comments
  // WARNING: insecure; use only if your local TLS trust store is broken.
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

function fmtUsd(x) {
  if (!isFinite(x)) return 'n/a';
  return `$${x.toFixed(2)}`;
}

function fmtPct(x) {
  if (!isFinite(x)) return 'n/a';
  return `${(x * 100).toFixed(2)}%`;
}

function asNumber(x) {
  const n = typeof x === 'string' ? Number(x) : x;
  return Number.isFinite(n) ? n : null;
}

async function httpJson(url, { method = 'GET', headers = {}, params } = {}) {
  const u = new URL(url);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      u.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(u, {
    method,
    headers: {
      'User-Agent': 'OpenClaw PolymarketArb/0.1',
      'Accept': 'application/json,text/plain,*/*',
      ...headers,
    },
  });

  const ct = res.headers.get('content-type') || '';
  const text = await res.text();

  // OpenDNS block page / HTML
  if (ct.includes('text/html') || text.trim().startsWith('<html')) {
    const err = new Error(`Non-JSON response from ${u.origin} (likely blocked).`);
    err.details = { status: res.status, contentType: ct, sample: text.slice(0, 300) };
    throw err;
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    const err = new Error(`Failed to parse JSON from ${u.toString()}`);
    err.details = { status: res.status, contentType: ct, sample: text.slice(0, 300) };
    throw err;
  }

  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} from ${u.toString()}`);
    err.details = { status: res.status, body: json };
    throw err;
  }

  return json;
}

function bestAsk(book) {
  const asks = Array.isArray(book?.asks) ? book.asks : [];
  // CLOB books often look like [{ price: '0.55', size: '123' }, ...]
  let p = null;
  let sz = null;
  for (const lvl of asks) {
    const lp = asNumber(lvl?.price);
    const ls = asNumber(lvl?.size);
    if (lp == null || ls == null) continue;
    if (p == null || lp < p) {
      p = lp;
      sz = ls;
    }
  }
  return { price: p, size: sz };
}

function estimateLiquidityUsd(sideAsk) {
  // crude: best ask size * price * $1 payout assumption
  if (sideAsk.price == null || sideAsk.size == null) return 0;
  return sideAsk.size * sideAsk.price;
}

function pickTokenIdsFromMarket(market) {
  // Try common shapes seen in the ecosystem.
  // - market.clob_token_ids: ["<yes>","<no>"]
  // - market.clobTokenIds: ...
  // - market.tokens / outcomes w/ token_id
  const direct = market?.clob_token_ids || market?.clobTokenIds;
  if (Array.isArray(direct) && direct.length >= 2) {
    return direct.map(String);
  }

  // Some formats provide outcomes with token ids.
  const toks = market?.tokens || market?.outcomes || market?.outcomeTokens;
  if (Array.isArray(toks)) {
    const ids = toks.map(t => t?.token_id ?? t?.tokenId ?? t?.clobTokenId).filter(Boolean).map(String);
    if (ids.length >= 2) return ids;
  }

  return null;
}

function isBinaryYesNo(market) {
  const outcomes = market?.outcomes || market?.outcomeNames;
  if (Array.isArray(outcomes) && outcomes.length === 2) {
    const a = String(outcomes[0]).toLowerCase();
    const b = String(outcomes[1]).toLowerCase();
    return (a.includes('yes') && b.includes('no')) || (a.includes('no') && b.includes('yes'));
  }
  // fallback: if we have exactly 2 token ids, treat as binary
  const ids = pickTokenIdsFromMarket(market);
  return Array.isArray(ids) && ids.length === 2;
}

function tradeCardNoSignal(reason, extra = {}) {
  const card = [
    '**POLYMARKET ARB (MVP)**',
    'NO SIGNAL',
    `Reason: ${reason}`,
    '',
    `Gamma: ${GAMMA_URL}`,
    `CLOB: ${CLOB_URL}`,
  ].join('\n');

  return {
    card,
    json: {
      ok: false,
      reason,
      ...extra,
      ts: new Date().toISOString(),
    },
  };
}

async function main() {
  let markets;
  try {
    markets = await httpJson(`${GAMMA_URL}/markets`, {
      params: {
        limit: TOP_MARKETS,
        offset: 0,
        active: 'true',
        closed: 'false',
      },
    });
  } catch (e) {
    const details = e?.details || {};
    const out = tradeCardNoSignal('Failed to fetch Gamma markets (blocked or network/TLS issue).', {
      error: String(e),
      details,
    });
    console.log(out.card);
    console.log('\nJSON:\n' + JSON.stringify(out.json, null, 2));
    process.exitCode = 0;
    return;
  }

  if (!Array.isArray(markets) || markets.length === 0) {
    const out = tradeCardNoSignal('Gamma returned no markets.', { marketsType: typeof markets });
    console.log(out.card);
    console.log('\nJSON:\n' + JSON.stringify(out.json, null, 2));
    return;
  }

  const candidates = markets.filter(m => !m?.closed && (m?.active ?? true)).filter(isBinaryYesNo);

  let best = null;

  for (const m of candidates) {
    const tokenIds = pickTokenIdsFromMarket(m);
    if (!tokenIds || tokenIds.length < 2) continue;

    // Heuristic: treat tokenIds[0] as YES and tokenIds[1] as NO if possible.
    const [t1, t2] = tokenIds;

    let b1, b2;
    try {
      b1 = await httpJson(`${CLOB_URL}/book`, { params: { token_id: t1 } });
      b2 = await httpJson(`${CLOB_URL}/book`, { params: { token_id: t2 } });
    } catch {
      continue;
    }

    const a1 = bestAsk(b1);
    const a2 = bestAsk(b2);
    if (a1.price == null || a2.price == null) continue;

    const sum = a1.price + a2.price;
    const edge = 1 - sum;

    const liq1 = estimateLiquidityUsd(a1);
    const liq2 = estimateLiquidityUsd(a2);
    const minLiq = Math.min(liq1, liq2);

    if (minLiq < MIN_LIQUIDITY_USD) continue;

    if (edge >= EDGE_THRESHOLD) {
      if (!best || edge > best.edge) {
        best = {
          market: m,
          tokenIds: [t1, t2],
          asks: [a1, a2],
          sum,
          edge,
          minLiquidityUsd: minLiq,
        };
      }
    }
  }

  if (!best) {
    const out = tradeCardNoSignal(`No opportunities found (edge>=${EDGE_THRESHOLD}, minLiq>=${MIN_LIQUIDITY_USD}).`, {
      scanned: candidates.length,
    });
    console.log(out.card);
    console.log('\nJSON:\n' + JSON.stringify(out.json, null, 2));
    return;
  }

  const m = best.market;
  const title = m?.question || m?.title || m?.name || 'Unknown market';
  const url = m?.url || m?.market_url || m?.slug ? `https://polymarket.com/market/${m.slug}` : null;

  const capUsd = best.minLiquidityUsd; // conservative cap at min available depth

  const card = [
    '**POLYMARKET ARB (MVP)**',
    `Market: ${title}`,
    url ? `Link: ${url}` : null,
    '',
    `Best asks used: ${best.asks[0].price.toFixed(3)} + ${best.asks[1].price.toFixed(3)} = ${best.sum.toFixed(3)}`,
    `Edge (buy both): ${fmtUsd(best.edge)} per $1 (${fmtPct(best.edge)})`,
    `Conservative size cap: ${fmtUsd(capUsd)} (min depth at best ask)`,
    '',
    'Plan (approval-gated): buy both legs ONLY if you can fill at/under these asks.',
    'Warning: non-atomic fills can turn this into a loss if one leg moves.',
  ].filter(Boolean).join('\n');

  const outJson = {
    ok: true,
    ts: new Date().toISOString(),
    strategy: 'single-market-buy-both',
    market: {
      id: m?.id ?? m?.condition_id ?? null,
      slug: m?.slug ?? null,
      title,
    },
    asks: best.asks,
    sum: best.sum,
    edge: best.edge,
    minLiquidityUsd: best.minLiquidityUsd,
    config: { GAMMA_URL, CLOB_URL, TOP_MARKETS, EDGE_THRESHOLD, MIN_LIQUIDITY_USD },
  };

  console.log(card);
  console.log('\nJSON:\n' + JSON.stringify(outJson, null, 2));
}

main().catch((e) => {
  const out = tradeCardNoSignal('Unhandled error', { error: String(e), details: e?.details });
  console.log(out.card);
  console.log('\nJSON:\n' + JSON.stringify(out.json, null, 2));
  process.exitCode = 0;
});
