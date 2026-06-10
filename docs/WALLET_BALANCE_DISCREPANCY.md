# Wallet Balance Discrepancy Investigation

## Status: ✅ RESOLVED — Correct API Endpoint Found

The funded wallet `0xe09729896fa906c336b2Ed36a7A08BB19E5De194` has **300 TORO**
on-chain when queried through the correct API endpoint.

The discrepancy was caused by using the wrong API base URL, not by any
network/state difference.

---

## Investigation Summary

| Date | Finding |
|---|---|
| 2026-06-10 | Initial report: "explorer shows 300 TORO" |
| 2026-06-10 | SDK `getTokenBalance` returns `{"result":true,"balance":"0"}` via `api.toronet.org` |
| 2026-06-10 | `isEnrolled` returns `true` — wallet IS enrolled for TORO |
| 2026-06-10 | `api.toronet.org/blockchain/` returns `chain="testnet", chainid=7777` |
| 2026-06-10 | Mainnet chain ID is **77777** (0x12fd1) per chainlist.org |
| 2026-06-10 | All alternative mainnet APIs fail (403/503/timeout) |
| 2026-06-10 | **BREAKTHROUGH**: Postman collection reveals `https://testnet.toronet.org/api` |
| 2026-06-10 | SDK+correct URL: `getTokenBalance` → **300 TORO** ✅ |
| 2026-06-10 | Blockchain status: chain 54321 (different from both 7777 and 77777!) |
| 2026-06-10 | Transaction history: Mint of 300 TORO on 2026-06-08 (tx `0x0895...2919`) |

---

## Root Cause: Wrong API Base URL

The SDK was initialized with the incorrect API base URL. The wallet's 300 TORO
was always on-chain — we were querying the wrong API.

### What Happened

The `torosdk` v0.2.0 has these built-in defaults:

```js
var DEFAULT_NETWORKS = {
  mainnet: { baseURL: "https://api.toronet.org" },       // Wrong: chain 7777, balance=0
  testnet: { baseURL: "http://testnet.toronet.org" },     // Wrong: returns 404
};
```

Neither default points to the actual working API. The correct endpoint is:
**`https://testnet.toronet.org/api`** (chain 54321).

### Evidence

| Endpoint | Chain ID | TORO Balance | Correct? |
|---|---|---|---|
| `https://api.toronet.org/blockchain/` | 7777 | 0 | ❌ SDK mainnet default |
| `http://testnet.toronet.org/blockchain/` | 404 | N/A | ❌ SDK testnet default |
| **`https://testnet.toronet.org/api/blockchain`** | **54321** | **300** | ✅ Correct API |

The correct URL was documented in the Toronet Postman collection at
`documenter.getpostman.com/view/20880049/2s93kz555m`.

---

## Correct API Topology

```
┌─────────────────────────────────────────────────────────────┐
│                SDK (torosdk v0.2.0)                         │
│  initializeSDK({                                            │
│    network: "testnet",                                      │
│    baseURL: "https://testnet.toronet.org/api"  ✅           │
│  })                                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│            https://testnet.toronet.org/api                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  GET /blockchain    → chain=testnet, chainid=54321  │   │
│  │  GET /token/toro/   → balance=300 TORO             │   │
│  │  POST /query        → TORO=300, fiat=0             │   │
│  │  POST /keystore     → wallet create/import          │   │
│  │  GET /query         → tx history: Mint of 300 TORO │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               Incorrect APIs (for reference)                │
│  https://api.toronet.org    → chainid 7777, balance=0       │
│  http://toronet.org/rpc     → 503 (mainnet RPC down)       │
│  http://testnet.toronet.org → 404                          │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoint Coverage (Correct API)

All endpoints via `https://testnet.toronet.org/api`:

| Operation | Method | Endpoint | Status | Response |
|---|---|---|---|---|
| Blockchain status | GET | `/blockchain` | ✅ | chain 54321, 28M+ blocks |
| TORO balance | GET | `/token/toro/` | ✅ | **300 TORO** |
| Multi-currency balance | GET | `/query` | ✅ | TORO=300, fiat=0 |
| Wallet role | GET | `/query` | ✅ | "client" |
| TORO tx history | GET | `/query` | ✅ | Mint of 300 TORO |
| Token metadata | GET | `/token/toro/` | ✅ | name/symbol/decimal |
| Token supply | GET | `/token/toro/` | ✅ | cap/circulating/reserving |
| Enrollment | GET | `/token/toro/` | ✅ | isEnrolled=true |
| Reserve info | GET | `/token/toro/` | ✅ | reserve addr returned |
| Create wallet | POST | `/keystore` | ✅ | New address returned |
| Import key | POST | `/keystore/` | ✅ | Duplicate detected |
| Fiat transfer | POST | `/currency/*/cl` | ✅ | Domain error (0 balance) |
| **TORO transfer** | GET | `/token/toro/` | ❌ | "invalid operation" |
| TNS isNameUsed | GET | `/tns` | ❌ | Invalid payload |
| Deploy contract | POST | deployer URL | ❌ | Prisma error |

---

## Transaction Details

The single transaction in the wallet's history is a **Mint** of 300 TORO:

```json
{
  "EV_Hash": "0x0895534d3788d7ee058ebad5da4d903358736d04b751d6457fec936402312919",
  "EV_Contract": "toroadminContract",
  "EV_Event": "Mint",
  "EV_From": "null",
  "EV_To": "0xe09729896fa906c336b2Ed36a7A08BB19E5De194",
  "EV_Value": 300,
  "EV_Time": "2026-06-08T20:13:56.000Z"
}
```

This directly links the wallet to the 300 TORO via a specific on-chain event. ✅

---

## Verified Facts

- **Wallet address**: `0xe09729896fa906c336b2Ed36a7A08BB19E5De194`
- **Wallet enrolled for TORO**: ✅ `true`
- **TORO balance via correct API**: **300 TORO** ✅
- **TORO balance via SDK default URL**: 0 (was using wrong API)
- **Fiat balances**: `{NGN:0, USD:0}` (wallet has no fiat deposits)
- **Reserve address**: `0xa231BB16803d8F7dcb6885B04183c9E71F4cdDF3`
- **Transaction history**: ✅ Mint of 300 TORO (tx `0x0895...2919`)
- **Wallet role**: "client"
- **Token name**: "Toro"
- **Token symbol**: "TORO"
- **Total cap**: 84398 TORO
- **Total circulating**: 33686 TORO
- **Chain ID (correct API)**: 54321
- **Correct API URL**: `https://testnet.toronet.org/api`
- **SDK mainnet default URL**: `https://api.toronet.org` (chain 7777, wrong!)
- **Mainnet chain ID (chainlist)**: 77777 (0x12fd1, RPC down)

---

## Conclusion

The wallet balance discrepancy is **RESOLVED**. The wallet has 300 TORO on-chain
at chain ID 54321, accessible via `https://testnet.toronet.org/api`. The
incorrect balance of 0 was caused by querying the wrong API endpoint
(`https://api.toronet.org`), which serves different blockchain data.

**TORO transfer is possible** via custodial POST to `/api/token/toro/cl` with
`clientpwd`. Successfully executed on 2026-06-10 (1 TORO sent, tx hash
`0xad4ef...52071`). The `transferToro()` function in `src/sdk/currency.ts`
wraps this endpoint.

---

## Recommendations

1. **For users**: Set `TORONET_BASE_URL=https://testnet.toronet.org/api` in your `.env` to query the correct API.
2. **For the Toronet team**: Update `torosdk`'s `DEFAULT_NETWORKS` — both the mainnet default (`https://api.toronet.org`, returns chain 7777) and the testnet default (`http://testnet.toronet.org`, returns 404) are incorrect. Also add a `transferToro()` method that wraps `POST /api/token/toro/cl` (currently only fiat transfers are supported).
3. **For this submission**: The wallet balance is confirmed. A custodial TORO transfer was successfully executed (1 TORO sent on-chain, tx `0xad4ef...52071`). The only remaining limitation is the absence of fiat deposits for fiat transfer testing.
