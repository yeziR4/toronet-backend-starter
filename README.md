# Toronet Backend Starter Kit

[![CI](https://github.com/yeziR4/toronet-backend-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/yeziR4/toronet-backend-starter/actions/workflows/ci.yml)

A production-grade Node.js/TypeScript backend server with deep integration of the **Toronet JS SDK (`torosdk`)** for building on the Toronet blockchain.

## Features

| Module | Endpoints | SDK Reference |
|--------|-----------|---------------|
| **Wallet** | Create, import, verify passwords | `createWallet`, `importWalletFromPrivateKeyAndPassword`, `verifyWalletPassword` |
| **Blockchain** | Network status, latest block, block by ID, transaction by ID | `getBlockchainStatus`, `getLatestBlockData`, `getBlockById`, `getTransaction` |
| **Balance** | TORO balance, currency balance (NGN/USD/EUR/GBP), token balance, token info | `getBalance`, `getCurrencyBalance`, `getTokenBalance`, `getTokenName` |
| **TNS** | Name resolution, address reverse-lookup, availability, register, update, delete | `getAddr`, `getName`, `setName`, `updateName`, `deleteName` |
| **KYC** | Setup KYC, perform verification, check status, enroll address | `setupKYC`, `performKYCForCustomer`, `isAddressKYCVerified`, `enrollAddress` |
| **Currency** | Transfer, inter-wallet transfer, supported currencies, exchange rates | `transferCurrency`, `makeInterWalletTransfer`, `getSupportedAssetsExchangeRates` |
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
TORONET_NETWORK=testnet    # "testnet" or "mainnet"
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info             # debug | info | warn | error
```

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

## Testing

```bash
npm test          # 93 tests (65 SDK module + 28 route-level HTTP)
npm run test:watch  # watch mode for development
```

All tests use mocked SDK calls — no live network required.

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
| Demo video | YouTube link (submitted separately to Toronet Foundation) |
| Written writeup | 500–1000 word writeup (submitted separately to Toronet Foundation) |
| `.env.example` | [.env.example](./.env.example) |

### Bounty Checklist

- [x] Public GitHub repository
- [x] README with inline SDK docs
- [x] Architecture diagram (see `ARCHITECTURE.txt`)
- [x] Demo video (3–8 minutes — submitted separately)
- [x] 500–1000 word writeup (submitted separately)
- [x] `.env.example` included
- [x] Production-grade error handling
- [x] CI pipeline (GitHub Actions — Node 18/20/22)
- [x] 93 unit + integration tests (65 SDK module tests + 28 route-level HTTP tests)

## License

MIT
