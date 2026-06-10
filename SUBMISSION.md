# Toronet Backend Starter Kit — Submission Writeup

## What it is

The Toronet Backend Starter Kit is a production-grade Node.js/TypeScript backend that wraps the Toronet blockchain JS SDK (`torosdk` v0.2.0) into a clean REST API with full type safety, error classification, and offline-testable coverage. It exposes 9 service modules — Wallet, Blockchain, Balance, TNS, KYC, Currency, Bridge, Products, and Deployer — as well as a custom custodial TORO transfer path that fills a gap in the base SDK.

## The core discovery: network topology

The most important finding of this project is that `torosdk` v0.2.0 ships with incorrect default API endpoints. Its `mainnet` default (`https://api.toronet.org`) returns chain ID 7777 with zero balance for funded wallets; its `testnet` default (`http://testnet.toronet.org`) returns 404 on all paths. The real testnet API lives at `https://testnet.toronet.org/api` (chain 54321), discovered through Toronet's Postman collection — a URL that appears nowhere in the SDK source.

This is documented with a full balance timeline, a root-cause analysis (`ROOT_CAUSE.md`), and a wallet-balance discrepancy report (`docs/WALLET_BALANCE_DISCREPANCY.md`). A dedicated regression test (`tests/network-topology.test.ts`) guards against accidental reversion to the wrong endpoints.

## Custom TORO transfer: bridging an SDK gap

The SDK's `transferCurrency()` method works only for fiat currencies (NGN, USD). TORO token transfers require a separate custodial POST to `/api/token/toro/cl`. The project implements `transferToro()` with strict input validation (address format `/^0x[a-fA-F0-9]{40}$/`, private key `/^0x[a-fA-F0-9]{64}$/`, positive amount), stable return types (`ToroTransferResult`, `WalletKeyResult`), and error classification that distinguishes validation errors (400) from upstream failures (502). A live transfer of 1 TORO was executed on-chain and verified: tx `0xad4ef...52071`.

## Engineering quality

The project passes a full `verify:repo` pipeline — TypeScript type-check (`tsc --noEmit`), production build (`tsc`), test suite (`vitest run`, 118 tests across 5 files), and lint (`eslint src/`) — on a fresh clone with zero network dependency. All tests are mocked, deterministic, and run in under 3 seconds.

The test suite covers:
- **SDK-level tests** (61): TORO transfer success/failure, import-key validation, duplicate key handling, malformed responses, edge cases for zero/negative amounts and invalid addresses
- **Route-level tests** (34): HTTP status codes (200/400/502), error codes (`VALIDATION_ERROR`/`SDK_ERROR`), response shapes for all 7 service modules
- **Network topology regression tests** (3): env config shape, URL construction pattern, SDK init passthrough
- **SDK integration layer tests** (13): module exports, error type hierarchy, wallet service shape
- **Wallet unit tests** (7): direct SDK wrapper coverage

## Live proof script

`scripts/verify-live-proof.ts` is a reviewer-grade verification tool that checks blockchain status, TORO balance, token metadata, supply statistics, wallet enrollment, transaction history, and exchange rates against the live network. It categorizes each check into one of five status buckets (PASS, EXPECTED_DOMAIN_ERROR, REQUIRES_CREDENTIALS, UPSTREAM_FAILURE, FAIL), supports a dry-run mode, and requires a double gate (`LIVE_PROOF_TRANSFER=1` in `.env` plus `--transfer` flag) before executing any on-chain transaction. Credentials are never logged.

## API contract

`docs/openapi.yaml` provides an OpenAPI 3.0 spec covering all 7 REST endpoints — wallet create/import, TORO import-key/transfer, balance queries, blockchain status, and health check — giving consumers a single source of truth for request/response shapes.

## Risks and limitations

The custom TORO transfer path is inherently the most brittle component because it wraps behavior outside the base SDK. The mainnet JSON-RPC endpoint (`http://toronet.org/rpc`) returns 503 and no public mainnet REST API exists, limiting production deployment options to testnet. The TNS `isNameUsed` query uses a GET+body pattern that some proxies reject — this is best-effort and non-fatal.

## Summary

This project demonstrates that a backend starter kit can be more than a scaffold: it can discover and document the real network topology, fill SDK gaps with production-grade custom code, and present verifiable on-chain proof — all while maintaining a clean, fully-tested, offline-verifiable codebase.
