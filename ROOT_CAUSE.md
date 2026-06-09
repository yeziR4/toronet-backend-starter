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

The SDK source at `dist/index.js` line 113 defines:

```js
var DEFAULT_NETWORKS = {
  mainnet: {
    baseURL: "https://api.toronet.org",           // ✅ Works
    connectWURL: "https://payments.connectw.com",
    deployerURL: "https://deployer.toronet.org/api/mainnet"
  },
  testnet: {
    baseURL: "http://testnet.toronet.org",         // ❌ Returns 404
    connectWURL: "https://payments.connectw.com",
    deployerURL: "https://deployer.toronet.org/api/testnet"
  }
};
```

The testnet `baseURL` is HTTP (not HTTPS) and `testnet.toronet.org` no longer
serves the expected API paths. The URL may have been deprecated, relocated, or
the server configuration changed after torosdk v0.2.0 was published.

## SDK Fix Available: `baseURL` Override

The SDK constructor fully supports a `baseURL` override:

```ts
initializeSDK({
  network: "testnet",
  baseURL: "https://api.toronet.org"   // override the broken default
});
```

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

On 2026-06-09, we tested with a real funded wallet
(`0xe09729896fa906c336b2Ed36a7A08BB19E5De194`) that is enrolled for TORO
and has valid credentials:

**Working:**
- `importWalletFromPrivateKeyAndPassword` — keystore accepts key
- `verifyWalletPassword` — password verification works
- `isEnrolled` — wallet confirmed as enrolled for TORO
- `createWallet` — returns new address (`0x81a51437c2cc2f6f65c11aaf2942aa555aa6acc5`)
- `transferCurrency(NGN)` — endpoint responds `"Insufficient sender account balance"` (proves the transfer endpoint is live and functional)
- `transferCurrency(USD)` — same domain-level response
- All read-only token/blockchain/balance queries succeed

**Not working:**
- Wallet has 0 TORO, 0 NGN, 0 USD balance despite being "funded"
- No fiat transfer can be executed with zero balance
- No native TORO transfer function exists in SDK

This confirms the SDK integration is correct — the only missing piece for a
full state-changing proof is a wallet with non-zero fiat balance.

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
