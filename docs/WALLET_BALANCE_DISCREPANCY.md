# Wallet Balance Discrepancy Investigation

## Status: UPSTREAM_BUG / API_NETWORK_MISMATCH (Unresolved)

The funded wallet `0xe09729896fa906c336b2Ed36a7A08BB19E5De194` has been reported to show 300 TORO on the Toronet Explorer, but the SDK and its underlying API consistently return a balance of 0.

This document records the complete investigation.

---

## Investigation Summary

| Date | Finding |
|---|---|
| 2026-06-10 | Initial report: "explorer shows 300 TORO" |
| 2026-06-10 | SDK `getTokenBalance` returns `{"result":true,"balance":"0"}` |
| 2026-06-10 | `getBalance` returns `{ngnBalance:0, usdBalance:0, toroGBalance:0}` |
| 2026-06-10 | `isEnrolled` returns `true` — wallet IS enrolled for TORO |
| 2026-06-10 | `https://api.toronet.org/blockchain/` returns `chain="testnet", chainid=7777` |
| 2026-06-10 | Mainnet chain ID is **77777** (0x12fd1) per chainlist.org |
| 2026-06-10 | `https://explorer.toronet.org/api/blockchain` also returns testnet data |
| 2026-06-10 | Explorer JS source confirms it uses `https://api.toronet.org` (same as SDK) |
| 2026-06-10 | Mainnet RPC `http://toronet.org/rpc` returns HTTP 503 |
| 2026-06-10 | Mainnet RPC port `toronet.org:8501` times out |
| 2026-06-10 | `http://testnet.toronet.org` serves same explorer app; no separate API found |
| 2026-06-10 | `https://toronet.org/api` returns 403 for POST operations |
| 2026-06-10 | No alternative mainnet API endpoint discovered |

---

## Root Cause Hypothesis

The SDK's default mainnet API at `https://api.toronet.org` actually serves **testnet** data (chain ID 7777). The wallet's 300 TORO (if real) is likely on **mainnet** (chain ID 77777), for which no public REST API endpoint exists.

### Evidence Chain

1. **SDK network config** (`node_modules/torosdk/dist/index.js:284-295`):
   - `mainnet` → `baseURL: "https://api.toronet.org"`
   - `testnet` → `baseURL: "http://testnet.toronet.org"`

2. **API at `https://api.toronet.org/blockchain/`** returns:
   ```json
   {"chain":"testnet","chainid":7777}
   ```

3. **Explorer at `https://explorer.toronet.org/api/blockchain`** also returns testnet data.

4. **Explorer JS source** (`scripts/blocks.js`) makes all AJAX calls to `https://api.toronet.org` — same endpoint as the SDK.

5. **Mainnet RPC** at `http://toronet.org/rpc` returns HTTP 503 (Service Unavailable).

6. **Mainnet chain ID** per chainlist.org is **77777** (0x12fd1), NOT 7777.

---

## API Topology

```
┌─────────────────────────────────────────────────────────┐
│                     SDK (torosdk v0.2.0)                │
│  initializeSDK({ network: "mainnet" })                  │
│  → baseURL = "https://api.toronet.org"                  │
│  → chainid = 7777 (testnet!)                            │
│                                                         │
│  initializeSDK({ network: "testnet" })                   │
│  → baseURL = "http://testnet.toronet.org"               │
│  → chainid = unknown (endpoint returns 404)             │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│            https://api.toronet.org                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │  GET /blockchain/ → chain=testnet, chainid=7777 │   │
│  │  GET /token/toro  → TORO balance (testnet)      │   │
│  │  GET /query       → fiat balances (testnet)     │   │
│  │  POST /keystore   → wallet ops (testnet)        │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│            http://toronet.org/rpc  (MAINNET RPC)        │
│  Status: 503 Service Unavailable                        │
│  Port 8501: timeout                                     │
└─────────────────────────────────────────────────────────┘
```

---

## API Endpoint Coverage

| Endpoint | Method | URL | Status |
|---|---|---|---|
| Blockchain status | GET | `https://api.toronet.org/blockchain/` | ✅ Returns testnet data |
| Latest block | GET | `https://api.toronet.org/blockchain/` (body) | ✅ Returns testnet block |
| TORO balance | GET | `https://api.toronet.org/token/toro` (body) | ✅ Returns 0 |
| Fiat balances | GET | `https://api.toronet.org/query` (body) | ✅ Returns all 0 |
| Enrollment | GET | `https://api.toronet.org/token/toro` (body) | ✅ isenrolled=true |
| Reserve | GET | `https://api.toronet.org/token/toro` (body) | ✅ Reserve address returned |
| Token name | GET | `https://api.toronet.org/token/toro` (body) | ✅ "Toro" |
| Token symbol | GET | `https://api.toronet.org/token/toro` (body) | ✅ "TORO" |
| Create wallet | POST | `https://api.toronet.org/keystore` | ✅ Works |
| Import key | POST | `https://api.toronet.org/keystore/` | ✅ Duplicate detected |
| Transfer fiat | POST | `https://payments.connectw.com/` | ✅ Domain error (0 balance) |
| Deploy contract | POST | `https://deployer.toronet.org/api/mainnet` | ❌ Prisma error |
| TNS isNameUsed | GET | `https://api.toronet.org/tns` | ❌ Invalid payload |
| Explorer API | GET | `https://explorer.toronet.org/api/blockchain` | ✅ Same testnet data |
| Alt API | GET/POST | `https://toronet.org/api/...` | ❌ 403 Forbidden |
| Mainnet RPC | POST | `http://toronet.org/rpc` | ❌ 503 |
| Mainnet RPC:8501 | POST | `http://toronet.org:8501` | ❌ Timeout |
| Testnet API | GET | `http://testnet.toronet.org/blockchain/` | ❌ 404 |

---

## Why the Balance Shows 300 (But API Returns 0)

The "300 TORO" observation came from the Explorer page at `https://toronet.org/explorer/address.html?address=0xe097...`. This page loads data dynamically via JavaScript from `https://api.toronet.org`. Since the API reports chainid=7777 (testnet), any balance visible on the JS-rendered explorer would also be the testnet balance.

**Possible explanations:**

| # | Hypothesis | Likelihood |
|---|---|---|
| 1 | The wallet was funded on mainnet (chain 77777) which has no public API. The SDK/API only sees testnet (chain 7777) where balance is 0. | High |
| 2 | The SDK's DEFAULT_NETWORKS mapping is incorrect: mainnet should point to a different API URL that serves mainnet data. | Medium |
| 3 | The 300 TORO was an explorer caching issue or user misreading. The true balance on the testnet network is actually 0. | Low |
| 4 | There are two versions of the API at `https://api.toronet.org` — one for mainnet and one for testnet — selected by a mechanism not exposed in the SDK. | Low |

---

## Verified Facts

- **Wallet address**: `0xe09729896fa906c336b2Ed36a7A08BB19E5De194`
- **Wallet enrolled for TORO**: ✅ `true`
- **TORO balance via SDK**: `0`
- **Fiat balances**: `{NGN:0, USD:0, TOROG:0}`
- **Reserve address**: `0x904111bC83cbB9E7856DC034aAf31D5943438Aa2`
- **Token name**: "Toro"
- **Token symbol**: "TORO"
- **Total cap**: 72449.94 TORO
- **Total circulating**: 49247.24 TORO
- **Create wallet**: ✅ Works (returns new address)
- **Import private key**: ✅ Duplicate detected (key is valid)
- **Verify password**: ✅ Password accepted
- **Chain ID (via API)**: 7777 (labeled "testnet")
- **Mainnet chain ID (chainlist)**: 77777 (0x12fd1)
- **Mainnet RPC URL**: `http://toronet.org/rpc` — 503

---

## Recommendations

1. **For the Toronet team**: Provide a working mainnet API endpoint or fix `https://api.toronet.org` to serve mainnet data when called without testnet parameters.
2. **For the SDK**: The `DEFAULT_NETWORKS.mainnet.baseURL` should point to a correct mainnet endpoint. If the current API at `https://api.toronet.org` is the only endpoint, add a query parameter or header to select the network.
3. **For users**: If you need to verify mainnet TORO balances, run a local Toronet mainnet node (`toronet --toromain --http`) and query it directly. There is no public mainnet API available as of June 2026.
4. **For this submission**: Document the discrepancy honestly. The wallet is proven (enrolled, imported, verified) but the balance cannot be confirmed via the public API due to the network mismatch.
