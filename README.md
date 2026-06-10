# Toronet Backend Starter Kit

[![CI](https://github.com/yeziR4/toronet-backend-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/yeziR4/toronet-backend-starter/actions/workflows/ci.yml)

**Demo video:** https://youtu.be/g9SuSx73NRQ

A production-grade Node.js/TypeScript backend server with deep integration of the **Toronet JS SDK (`torosdk`)** for building on the Toronet blockchain.

## ⚠️ Network Topology — Critical Context

The `torosdk` v0.2.0 ships with incorrect default API URLs. Understanding
this is essential for any reviewer or user of this project.

### The Three Networks

| Network | Chain ID | API Endpoint | Used By | TORO Balance |
|---|---|---|---|---|
| **Testnet (real)** | **54321** | `https://testnet.toronet.org/api` | **This project (after discovery)** | **299 TORO** ✅ (was 300 before 1 TORO transfer) |
| SDK "mainnet" default | 7777 | `https://api.toronet.org` | SDK default — actually testnet data | 0 |
| Mainnet (chainlist) | 77777 | `http://toronet.org/rpc` (503) | No public API available | Unknown |

### Balance Timeline

| Event | Amount | Tx / Note |
|---|---|---|
| Minted to sender (`0xe097...De194`) | **+300 TORO** | `0x0895...2919` |
| Custodial transfer to `0xdbec...D179` | **−1 TORO** | `0xad4ef...52071` |
| **Sender current** | **299 TORO** | Verified via correct API |
| **Recipient current** | **1 TORO** | Verified via correct API |

### What went wrong

The SDK's `DEFAULT_NETWORKS` maps:
- `mainnet` → `https://api.toronet.org` — **returns chain 7777** (testnet data, zero balance)
- `testnet` → `http://testnet.toronet.org` — **returns 404** for all paths

The correct endpoint `https://testnet.toronet.org/api` (chain 54321) was
discovered via the Toronet Postman collection and is **not** in the SDK.

Set `TORONET_BASE_URL=https://testnet.toronet.org/api` in `.env` to use
the correct endpoint. See [`ROOT_CAUSE.md`](./ROOT_CAUSE.md) for the full
investigation and [`docs/WALLET_BALANCE_DISCREPANCY.md`](./docs/WALLET_BALANCE_DISCREPANCY.md)
for the complete resolution.

## Features

| Module | Endpoints | SDK Reference |
|--------|-----------|---------------|
| **Wallet** | Create, import, verify passwords | `createWallet`, `importWalletFromPrivateKeyAndPassword`, `verifyWalletPassword` |
| **Blockchain** | Network status, latest block, block by ID, transaction by ID | `getBlockchainStatus`, `getLatestBlockData`, `getBlockById`, `getTransaction` |
| **Balance** | TORO, fiat, token balances | `getBalance`, `getCurrencyBalance`, `getTokenBalance`, `getTokenName` |
| **TNS** | Name resolution, reverse-lookup, register, update, delete | `getAddr`, `getName`, `setName`, `updateName`, `deleteName` |
| **KYC** | Setup, perform, check status, enroll | `setupKYC`, `performKYCForCustomer`, `isAddressKYCVerified`, `enrollAddress` |
| **Currency** | Fiat transfer, inter-wallet, exchange rates | `transferCurrency`, `makeInterWalletTransfer`, `getSupportedAssetsExchangeRates` |
| **TORO Transfer** 🆕 | **Custodial TORO token transfer** | **`transferToro()`** — custom, not in torosdk |
| **Bridge** | Bridge fees (Solana/Polygon/BSC/Base/Arbitrum), bridge transfer, bridge balance | `getBridgeTokenFee*`, `bridgeToken*`, `getBridgeBalance` |
| **Products** | Create, update, get product | `recordProduct`, `updateProduct`, `getProduct` |
| **Deployer** | Deploy contract, register, check registration | `deployContract`, `registerContract`, `isContractRegistered` |

## Quick Start

**Requires Node.js 18+ (tested on v22).** Using `pnpm` is strongly recommended — the lockfile is `pnpm-lock.yaml`.

```bash
# Clone
git clone https://github.com/yeziR4/toronet-backend-starter.git
cd toronet-backend-starter

# Install (use pnpm for clean installs — the lockfile is pnpm-lock.yaml)
pnpm install

# Configure
cp .env.example .env
# Edit .env if needed (defaults: testnet, port 3000)

# Build
pnpm run build

# Start
pnpm start
```

For development with hot reload:

```bash
pnpm run dev
```

> **Note for npm users:** If using `npm install`, peer dependency resolution may fail
> due to `@eslint/js` vs `eslint` version alignment. If that happens, use
> `npm install --legacy-peer-deps` or switch to `pnpm`. The project is tested with
> `pnpm` on CI (Node 18/20/22 via GitHub Actions).

## API

All endpoints return JSON with a consistent shape:

**Success:** `{ "success": true, "data": { ... } }`

**Error:** `{ "success": false, "error": { "message": "...", "code": "...", "statusCode": 400 } }`

### Wallet

| Method | Path | Body |
|--------|------|------|
| POST | `/api/wallet/create` | `{ "username"?, "password" }` |
| POST | `/api/wallet/import` | `{ "privateKey", "password" }` |
| POST | `/api/wallet/import-key` | `{ "privateKey", "password" }` |
| POST | `/api/wallet/verify` | `{ "address", "password" }` |

### Blockchain

| Method | Path |
|--------|------|
| GET | `/api/blockchain/status` |
| GET | `/api/blockchain/latest-block` |
| GET | `/api/blockchain/blocks/:blockId` |
| GET | `/api/blockchain/transactions/:txId` |

### Balance

| Method | Path |
|--------|------|
| GET | `/api/balance/:address` |
| GET | `/api/balance/:address/currency/:currency` |
| GET | `/api/balance/:address/token` |
| GET | `/api/balance/token/:contractAddress/info` |

### TNS

| Method | Path | Body |
|--------|------|------|
| GET | `/api/tns/resolve/name/:name` | — |
| GET | `/api/tns/resolve/address/:address` | — |
| GET | `/api/tns/available/:name` | — |
| POST | `/api/tns/register` | `{ "address", "name", "password" }` |
| PUT | `/api/tns/update` | `{ "address", "name", "newName", "password" }` |
| POST | `/api/tns/delete` | `{ "address", "password" }` |

### KYC

| Method | Path | Body |
|--------|------|------|
| POST | `/api/kyc/setup` | `{ "firstName", "lastName", "bvn", "currency", "phoneNumber", "dob", "address", "admin", "adminpwd" }` |
| POST | `/api/kyc/verify` | `{ "firstName", "lastName", "bvn", ..., "address", "admin", "adminpwd" }` |
| GET | `/api/kyc/status/:address` | — |
| POST | `/api/kyc/enroll` | `{ "currency", "address", "admin", "adminpwd", "targetAddress" }` |

### Currency

| Method | Path | Body |
|--------|------|------|
| POST | `/api/currency/transfer` | `{ "currency", "senderAddr", "senderPwd"?, "receiverAddr", "amount" }` |
| POST | `/api/currency/inter-wallet` | `{ "from", "to", "amount", "password"?, "currencyName"? }` |
| GET | `/api/currency/supported` | — |
| GET | `/api/currency/rates` | — |

### Bridge

| Method | Path | Body/Query |
|--------|------|------|
| GET | `/api/bridge/fees/:chain?contractAddress=...&amount=...` | — (query params) |
| POST | `/api/bridge/transfer` | `{ "chain", "from", "pwd"?, "contractaddress", "tokenname", "amount" }` |
| GET | `/api/bridge/balance/:address` | — |

**Supported chains:** `solana`, `polygon`, `bsc`, `base`, `arbitrum`

### Products

| Method | Path | Body |
|--------|------|------|
| POST | `/api/products` | `{ "productId"?, "productName", "description"?, "productImage"?, "admin"?, "adminpwd"? }` |
| PUT | `/api/products` | `{ "productId", "productName"?, "description"?, "productImage"?, "admin"?, "adminpwd"? }` |
| GET | `/api/products/:productId?admin=...&adminpwd=...` | — (query params) |

### Deployer

| Method | Path | Body |
|--------|------|------|
| POST | `/api/deployer/deploy` | `{ "owner"?, "bytecode", "abi"?, "constructorArgs"? }` |
| POST | `/api/deployer/register` | `{ "address", "password"?, "contract" }` |
| GET | `/api/deployer/check/:contract` | — |

### Health

| Method | Path |
|--------|------|
| GET | `/health` |
| GET | `/` |

## Environment Variables

See `.env.example`:

```
TORONET_NETWORK=testnet         # "testnet" or "mainnet"
TORONET_BASE_URL=               # **MUST override** — SDK default URLs are wrong
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info                  # debug | info | warn | error
WALLET_PRIVATE_KEY=             # optional — only needed for custodial TORO transfer
WALLET_PASSWORD=                # optional — only needed for custodial TORO transfer
```

> **⚠️ TORONET_BASE_URL is required.** The `torosdk` v0.2.0 ships with two
> incorrect defaults:
> - `mainnet` → `https://api.toronet.org` (returns chain 7777, NOT mainnet)
> - `testnet` → `http://testnet.toronet.org` (returns 404)
>
> **Set it to `https://testnet.toronet.org/api`** to access the real testnet
> (chain 54321) with actual on-chain data. See [`ROOT_CAUSE.md`](./ROOT_CAUSE.md)
> for the full investigation.

## Project Structure

```
src/
├── index.ts                 Express server entry point
├── config/env.ts            Zod-validated environment config
├── sdk/
│   ├── client.ts            Toronet SDK init and access
│   ├── wallet.ts            Wallet create/import/verify
│   ├── blockchain.ts        Chain status, blocks, transactions
│   ├── balance.ts           TORO, fiat, and token balances
│   ├── tns.ts               TNS name operations
│   ├── kyc.ts               KYC lifecycle
│   ├── currency.ts          Transfers and exchange rates
│   ├── bridge.ts            Multi-chain bridge
│   ├── products.ts          Product CRUD
│   └── deployer.ts          Contract deployment
├── routes/                  Express route handlers (one per module)
├── middleware/              Error handler
├── types/                   TypeScript interfaces and error classes
└── utils/                   Logger, response helpers, architecture diagram
tests/                       Vitest test suite
```

## Live-Verified Flows

This project has been tested against the live Toronet API at
**`https://testnet.toronet.org/api`** (chain 54321) with a real funded wallet
(originally **300 TORO**, current **299 TORO** after 1 TORO transfer). A **custodial TORO transfer was successfully executed**
on-chain (1 TORO sent, tx `0xad4ef...52071`).

See [`LIVE_VERIFIED_FLOWS.md`](./LIVE_VERIFIED_FLOWS.md) for the full
endpoint-by-endpoint report (16 passes, 8 expected domain errors/admin-required,
2 upstream bugs, 1 resolved network mismatch).

### Quick live verification

```bash
# Read-only — no wallet needed, checks blockchain + balances + tx history
npx tsx scripts/verify-live-proof.ts

# Full proof with optional transfer (requires WALLET_* in .env)
npx tsx scripts/verify-live-proof.ts --transfer <recipient> [amount]

# Legacy: individual endpoint tests
npx tsx scripts/verify-live.ts
```

### What's proven live (16 passes)

| Flow | Result |
|---|---|
| Blockchain status (chain 54321) | ✅ Returns active testnet data |
| Token name / symbol / decimal | ✅ "Toro" / "TORO" / 18 |
| Wallet balance | ✅ **299 TORO** (was 300 before 1 TORO transfer) |
| Token balance | ✅ **299 TORO** (was 300 before 1 TORO transfer) |
| Transaction history | ✅ Mint + Transfer events on-chain |
| Exchange rates | ✅ Returns 7 fiat currencies |
| Token supply statistics | ✅ Total cap, circulating, reserving |
| Enrollment check | ✅ Wallet confirmed enrolled for TORO |
| Wallet creation + key import | ✅ New address created, key imported |
| **TORO custodial transfer** 🆕 | ✅ **1 TORO sent on-chain (tx confirmed)** |
| Fiat transfer endpoint | ✅ Reached (0 balance = domain error) |

## Testing

```bash
npm test          # 98 tests (SDK module + route-level HTTP + axios-mocked TORO transfer)
npm run test:watch  # watch mode for development
```

All tests use mocked SDK and axios calls — no live network required.

### CI Status

Every push is tested against Node 18, 20, and 22 via GitHub Actions.

## Architecture

```
Client → Express Routes → SDK Integration Layer → torosdk → Toronet Network
         (REST/JSON)       (src/routes/)          (src/sdk/)    (testnet|mainnet)
```

Every SDK function is wrapped in a typed module that:
1. Validates inputs before calling the SDK
2. Catches SDK exceptions and maps them to typed `SdkError` instances
3. Returns consistently shaped objects

Errors propagate to the Express error-handling middleware and are serialized as:

```json
{ "success": false, "error": { "message": "...", "code": "SDK_ERROR", "statusCode": 502 } }
```

## SDK Reference

This project wraps the following `torosdk` v0.2.0 functions:

- **Wallet:** `createWallet`, `importWalletFromPrivateKeyAndPassword`, `importKey`, `verifyWalletPassword`
- **Blockchain:** `getBlockchainStatus`, `getLatestBlockData`, `getBlockById`, `getTransaction`
- **Balance:** `getBalance`, `getCurrencyBalance`, `getTokenBalance`, `getTokenName`, `getTokenSymbol`, `getTokenDecimal`
- **TNS:** `setName`, `getName`, `getAddr`, `updateName`, `deleteName`, `isNameUsed`
- **KYC:** `setupKYC`, `performKYCForCustomer`, `isAddressKYCVerified`, `enrollAddress`
- **Currency:** `transferCurrency`, `makeInterWalletTransfer`, `getSupportedAssetsExchangeRates`
- **Bridge:** `getBridgeTokenFeeSol`, `getBridgeTokenFeePolygon`, `getBridgeTokenFeeBSC`, `getBridgeTokenFeeBase`, `getBridgeTokenFeeArbitrum`, `bridgeTokenSol`, `bridgeTokenPolygon`, `bridgeTokenBSC`, `bridgeTokenBase`, `bridgeTokenArbitrum`, `getBridgeBalance`
- **Products:** `recordProduct`, `updateProduct`, `getProduct`
- **Deployer:** `deployContract`, `registerContract`, `isContractRegistered`

### Custom functions (not in torosdk)

These functions hit API endpoints that the SDK does not expose:

| Function | Endpoint | Purpose |
|---|---|---|
| `transferToro()` | `POST /api/token/toro/cl` | Custodial TORO token transfer (SDK only does fiat) |
| `importWalletKey()` | `POST /api/keystore/` | Import private key for custodial signing |

## Requirements

- **Node.js 18+** (tested on v22.22.2)
- **pnpm** (recommended) or npm

## Troubleshooting

### `/api/blockchain/status` returns 502

This is expected when the Toronet testnet node is unreachable. The SDK integration
layer wraps all network errors as `SdkError` (status 502). To verify connectivity:

```bash
# Check that the SDK can reach the Toronet network:
curl http://localhost:3000/api/blockchain/status
# → {"success":false,"error":{"message":"SDK operation failed: getBlockchainStatus — ...","code":"SDK_ERROR","statusCode":502}}
```

This is a **documented behavior**, not a bug. The app is designed to degrade gracefully
when the network is unavailable.

### Smoke test reports live endpoints as skipped/failed

The smoke test (`npm run smoke:test`) checks SDK initialization and module imports (always
passes) and then attempts live queries against Toronet testnet. If the Toronet testnet
node is unreachable, live queries are **skipped** (default mode) or **failed** (strict
mode with `SMOKE_LIVE=1`).

This is expected — the Toronet testnet may not be publicly accessible at all times.
The project's unit/integration tests use mocked SDK calls and do not require a live
network.

```bash
# Default mode (offline-safe — skips unreachable endpoints)
npm run smoke:test

# Strict mode (fails if live endpoints are unreachable)
SMOKE_LIVE=1 npm run smoke:test
```

### Environment not loading

Ensure `.env` exists and contains at minimum `TORONET_NETWORK=testnet`. If using
a custom `.env` path, set the `DOTENV_CONFIG_PATH` environment variable.

## Bounty Submission

This project was built for the **Toronet Foundation Bounty** (June 2026).

### Submission Artifacts

| Artifact | Location |
|----------|----------|
| Source repository | [github.com/yeziR4/toronet-backend-starter](https://github.com/yeziR4/toronet-backend-starter) |
| Architecture diagram | [`ARCHITECTURE.txt`](./ARCHITECTURE.txt) |
| Live verification report | [`LIVE_VERIFIED_FLOWS.md`](./LIVE_VERIFIED_FLOWS.md) |
| Root-cause analysis | [`ROOT_CAUSE.md`](./ROOT_CAUSE.md) |
| Reviewer quickstart | [`REVIEWER_QUICKSTART.md`](./REVIEWER_QUICKSTART.md) |
| Demo video | [https://youtu.be/g9SuSx73NRQ](https://youtu.be/g9SuSx73NRQ) |
| Written writeup | 500–1000 word writeup (submitted separately to Toronet Foundation) |
| `.env.example` | [.env.example](./.env.example) |

### Bounty Checklist

- [x] Public GitHub repository
- [x] README with inline SDK docs
- [x] Architecture diagram (see `ARCHITECTURE.txt`)
- [x] Live verification report with real wallet testing (minted 300 TORO, 1 TORO transferred on-chain, sender now 299 TORO)
- [x] Root-cause analysis of upstream limitations (incorrect SDK defaults, network topology)
- [x] Reviewer quickstart for fast verification
- [x] Demo video (3–8 minutes — [https://youtu.be/g9SuSx73NRQ](https://youtu.be/g9SuSx73NRQ))
- [x] 500–1000 word writeup (submitted separately)
- [x] `.env.example` included
- [x] Production-grade error handling
- [x] CI pipeline (GitHub Actions — Node 18/20/22)
- [x] 98 unit + integration tests (SDK module + route-level HTTP + TORO transfer)
- [x] TORO token transfer (`transferToro()` — hits endpoint not covered by torosdk)

## License

MIT
