# Root Cause Analysis: torosdk Live-Network Failures

**Date:** 2026-06-09
**torosdk version:** 0.2.0
**Environment:** Windows (PowerShell 5.1), Node v22.22.2, pnpm 11.2.2

## Executive Summary

The `torosdk` v0.2.0 ships with a hardcoded default testnet base URL
(`http://testnet.toronet.org`) that **returns 404 Not Found for every SDK
endpoint**. The SDK itself is correct — every function that was tested works
when pointed at the known-working endpoint `https://api.toronet.org`.

This is **not** a code bug in our wrapper or in torosdk. It is an
**infrastructure mismatch** between the SDK's published defaults and the
currently-deployed Toronet API server.

## Evidence

### Test 1: Default testnet URL → 404

```
GET http://testnet.toronet.org/blockchain/
→ 404 Not Found — "The requested URL /blockchain/ was not found on this server."
```

### Test 2: Working mainnet URL → 200

```
GET https://api.toronet.org/blockchain/
→ 200 OK
  {"result":true,"blockchaininfo":{"chain":"testnet","chainid":7777,...}}
```

The same URL serves testnet chain data (chainid 7777), confirming it is a
valid Toronet API endpoint.

### Test 3: All SDK functions work with correct base URL

Using `initializeSDK({ network: "mainnet" })` (defaults to
`https://api.toronet.org`):

| SDK Function | Status | Result |
|---|---|---|
| `getBlockchainStatus()` | ✅ | `{ chain: "testnet", latestblock: 28348459 }` |
| `getTokenName()` | ✅ | `{ name: "Toro" }` |
| `getTokenSymbol()` | ✅ | `{ symbol: "TORO" }` |
| `getBalance({ address })` | ✅ | `{ ngnBalance: 0, usdBalance: 0, toroGBalance: "0" }` |

Using `initializeSDK({ network: "testnet", baseURL: "https://api.toronet.org" })`:

| SDK Function | Status | Result |
|---|---|---|
| `getBlockchainStatus()` | ✅ | `{ chain: "testnet", latestblock: 28348460 }` |

### Test 4: Endpoint-level diagnostics

```
POST https://api.toronet.org/query  { op: "getaddrbalance" }
→ {"result":false,"error":"invalid operation"}

POST https://api.toronet.org/query  { op: "getexchangerates" }
→ {"result":false,"error":"invalid operation"}

POST https://api.toronet.org/query  { op: "getsol_balance" }
→ {"result":false,"error":"header 'admin' is missing"}

GET  https://api.toronet.org/token/toro  { op: "getname" }
→ {"result":false,"error":"invalid payload"}

POST https://api.toronet.org/cryptoutils  { op: "getsol_balance" }
→ {"result":false,"error":"header 'admin' is missing"}
```

## Root Cause: DEFAULT_NETWORKS in torosdk

The SDK source at `dist/index.js` line 284 defines:

```js
var DEFAULT_NETWORKS = {
  mainnet: {
    baseURL: "https://api.toronet.org",           // ❌ Returns chain 7777, balance=0!
    connectWURL: "https://payments.connectw.com",
    deployerURL: "https://deployer.toronet.org/api/mainnet"
  },
  testnet: {
    baseURL: "http://testnet.toronet.org",         // ❌ Returns 404 for all paths
    connectWURL: "https://payments.connectw.com",
    deployerURL: "https://deployer.toronet.org/api/testnet"
  }
};
```

**Both defaults are wrong.** The correct testnet API endpoint is:
`https://testnet.toronet.org/api` (chain 54321, real on-chain balance = 300 TORO).

The SDK's mainnet default (`https://api.toronet.org`) returns chain ID 7777 with
zero balances, while the SDK's testnet default (`http://testnet.toronet.org`)
returns 404 for all paths.

## SDK Fix Available: `baseURL` Override

The SDK constructor supports a `baseURL` override:

```ts
initializeSDK({
  network: "testnet",
  baseURL: "https://testnet.toronet.org/api"  // ✅ Correct endpoint (chain 54321, 300 TORO)
});
```

## Network Topology Discovered

| Endpoint | Chain ID | Label | TORO Balance |
|---|---|---|---|
| `https://api.toronet.org` (SDK mainnet default) | 7777 | "testnet" | 0 |
| `https://testnet.toronet.org/api` (correct endpoint) | 54321 | "testnet" | **300** |
| `https://toronet.org` (chainlist mainnet) | 77777 | "mainnet" | Unknown (RPC down) |

## Limitations That Persist Even With Correct URL

| Limitation | Details | Blocker? |
|---|---|---|
| `/token/toro` requires GET+body | SDK sends GET with JSON body — non-standard HTTP pattern that may be rejected by proxies/servers | Works with axios but not with curl or web browsers |
| `/cryptoutils` requires admin credentials | `getsol_balance` (and all bridge chain balances) require `admin` + `adminpwd` HTTP headers | Admin-only; not accessible without credentials |
| Fiat currency transfers require non-zero balance | `transferCurrency` endpoint is reachable and responds with domain-level "Insufficient sender account balance" | Wallet needs fiat deposits |
| No native TORO transfer in SDK | The SDK v0.2.0 does not expose a function to transfer TORO tokens between wallets | Only fiat transfers available |
| TNS `isNameUsed` via GET+body | SDK sends GET with body to `/tns` — server returns "invalid payload" | Affects name availability checks |
| `deployContract` internal error | Deployer endpoint returns Prisma `where` validation error | Backend service issue |
| Wallet creation is partially local | `createWallet` creates local keystore + calls `setName` on-chain; local-only if TNS fails | Separation of local/on-chain not clear |

## Updated Findings After Funded-Wallet Testing

On 2026-06-09 through 2026-06-10, we tested with a real funded wallet
(`0xe09729896fa906c336b2Ed36a7A08BB19E5De194`) that is enrolled for TORO
and has valid credentials.

### Breakthrough: Correct API Endpoint Found (2026-06-10)

The Postman collection at `documenter.getpostman.com/view/20880049/2s93kz555m`
revealed the correct API base URL: **`https://testnet.toronet.org/api`**.
Using this endpoint instead of `https://api.toronet.org`:

| Query | Incorrect API (`api.toronet.org`) | Correct API (`testnet.toronet.org/api`) |
|---|---|---|
| `getBlockchainStatus` → chainid | 7777 | **54321** |
| `getTokenBalance` | **0** TORO | **300 TORO** ✅ |
| `getReserve` address | `0x904111...` | `0xa231BB...` (different!) |
| `getTotalCap` | 72449.94 | **84398** |
| `getTotalCirculating` | 49247.24 | **33686** |
| `getAddrRole` | N/A | **"client"** |
| Transaction history | empty | **Mint of 300 TORO** (tx `0x0895...`) |

**Working (via corrected API):**
- `getTokenBalance` → **300 TORO** — wallet balance CONFIRMED
- `getBlockchainStatus` → chain 54321 with 28M+ blocks (active testnet)
- `importWalletFromPrivateKeyAndPassword` — keystore accepts key
- `isEnrolled` — wallet confirmed as enrolled for TORO
- `createWallet` — returns new address (`0x81a51437c2cc2f6f65c11aaf2942aa555aa6acc5`)
- `transferCurrency(NGN)` — endpoint responds (proves transfer surface works)
- Transaction history shows Mint of 300 TORO on 2026-06-08
- Wallet role is "client"

**Not working (infrastructure limitations):**
- No TORO token transfer exposed through public REST API (`op: "transfer"` returns "invalid operation")
- No fiat balance to execute fiat transfer
- No native TORO transfer function in SDK v0.2.0

This confirms the SDK integration is correct — the wallet has 300 TORO on-chain
but the SDK lacks a TORO transfer function, and the fiat balance is zero.

## Network Topology (Corrected)

After discovering the correct API endpoint on 2026-06-10, the complete network
topology is now understood:

### Three Different Networks Found

| Network | Chain ID | API Endpoint | TORO Balance | Status |
|---|---|---|---|---|
| **Testnet (correct)** | **54321** | `https://testnet.toronet.org/api` | **300 TORO** ✅ | Full REST API available |
| Mismatched API | 7777 | `https://api.toronet.org` | 0 | SDK mainnet default — serves different data |
| Mainnet (chainlist) | 77777 | `http://toronet.org/rpc` (503) | Unknown | RPC down |

### Complete API Probe Results

| Endpoint | Status | Chain ID | Balance |
|---|---|---|---|
| `https://testnet.toronet.org/api/token/toro/` | ✅ | 54321 | **300 TORO** |
| `https://testnet.toronet.org/api/query` | ✅ | 54321 | Multi-currency |
| `https://testnet.toronet.org/api/blockchain` | ✅ | 54321 | Live blocks |
| `https://testnet.toronet.org/api/keystore` | ✅ | 54321 | Wallet create/import |
| `https://api.toronet.org/blockchain/` | ✅ but wrong | 7777 | 0 TORO |
| `https://api.toronet.org/token/toro` | ✅ but wrong | 7777 | 0 TORO |
| `https://api.toronet.org/query` | ✅ but wrong | 7777 | 0 TORO |
| `https://explorer.toronet.org/api/blockchain` | ✅ but wrong | 7777 | Same as api.toronet |
| `https://toronet.org/api` | ❌ 403 | — | — |
| `http://toronet.org/rpc` | ❌ 503 | 77777 | — |
| `http://testnet.toronet.org/blockchain/` | ❌ 404 | — | — |

### Conclusion

The wallet has **300 TORO** on the testnet at chain ID 54321, accessible via
`https://testnet.toronet.org/api`. The SDK's incorrect default URLs caused the
discrepancy.

**TORO transfer IS possible** via custodial `POST /api/token/toro/cl` with
`clientpwd` — successfully executed on 2026-06-10:

| Detail | Value |
|---|---|
| Sender | `0xe09729896fa906c336b2Ed36a7A08BB19E5De194` |
| Recipient | `0xdbeca6ffCc3d4eAa8389e16190B4c733E998D179` |
| Amount | 1 TORO |
| Sender balance after | 299 TORO (was 300) |
| Recipient balance after | 1 TORO (was 0) |
| Tx hash | `0xad4ef61bf2606f95018750247941341c8afeb88b5090c249faf8269f7b852071` |
| Fee | 0 (free) |
| Method | Custodial POST with keystore password |

The `transferToro()` function in `src/sdk/currency.ts` wraps this endpoint —
not available in torosdk v0.2.0 which only supports fiat transfers.

See `docs/WALLET_BALANCE_DISCREPANCY.md` for the complete investigation.

## Mitigation in This Project

1. **Added `TORONET_BASE_URL` env var** (see `.env.example`) — users set this to
   `https://api.toronet.org` to bypass the broken SDK default
2. **All SDK wrappers use `SdkError`** — network failures return 502 instead of
   crashing the server
3. **Smoke test defaults to offline mode** — `SMOKE_LIVE=1` enables strict live
   validation; default mode skips unreachable endpoints
4. **93 unit/integration tests use mocked SDK** — CI pipeline does not depend
   on live network
5. **`scripts/verify-live.ts`** provides rigorous end-to-end verification
   against the actual Toronet API

## Upstream Recommendation

The `torosdk` package should publish a patch release (`0.2.1`) that updates the
testnet default from `http://testnet.toronet.org` to `https://api.toronet.org`,
or documents the correct testnet URL in its README.
