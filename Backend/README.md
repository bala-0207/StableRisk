# StableRisk Backend

## Overview

Express API server for StableRisk — serves the Issuer/Holder stablecoin simulation and vLEI credential signing endpoints. Runs on port 4000 and connects to the remote ACTUS Financial Contracts server for simulation execution.

---

## How to Run

```bash
npm install
npm run build
npm run server
```

The server starts at **http://localhost:4000**.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run server` | Build + start the Express server |
| `npm run dev` | Watch mode — recompile on file changes |
| `npm run type-check` | TypeScript type checking without emitting |
| `npm run clean` | Remove the `dist/` folder |

---

## Requirements

- Node.js >= 18.x
- TypeScript >= 5.x
- Internet connection (simulations connect to ACTUS server at `34.203.247.32`)
- Docker + Docker Compose (required only for vLEI endpoints)

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check — tests ACTUS server connectivity |
| `POST` | `/api/stablecoin-simulate` | Run issuer or holder simulation with threshold overrides |
| `POST` | `/api/vlei/run` | Execute vLEI credential signing workflow via Docker |
| `GET` | `/api/vlei/query` | Query existing credentials from KERIA |
| `GET` | `/api/vlei/status` | Check KERIA + vLEI container health |

---

## Directory Structure

```
Backend/
├── src/
│   ├── server.ts                    # Express app entry point
│   ├── routes/
│   │   ├── simulation.routes.ts     # POST /api/stablecoin-simulate
│   │   └── vlei.routes.ts           # vLEI credential signing routes
│   ├── api/
│   │   ├── SimulationRunner.ts      # Postman collection executor (SIMPLE + SCRIPTED modes)
│   │   └── ACTUSClient.ts           # ACTUS server HTTP client
│   ├── config/
│   │   ├── config-loader.ts         # Loads & resolves stablecoin config files
│   │   ├── config.types.ts          # TypeScript interfaces for config system
│   │   └── monitoring-time-generator.ts  # Generates ISO timestamps
│   ├── verifier/
│   │   └── StableCoinVerifier.ts    # Core risk verification logic
│   ├── types/
│   │   └── index.ts                 # Shared TypeScript type definitions
│   ├── utils/
│   │   └── validation.ts            # Data validation & summary display
│   └── mappings/
│       ├── issuer-mappings.json     # Issuer config field mappings
│       └── holder-mappings.json     # Holder config field mappings
├── config/
│   └── stablecoin/
│       ├── defaults/                # Base Postman collection JSONs
│       │   ├── Stables-HT-ISS-time-daily-5.json     # Issuer collection
│       │   ├── Stables-HT-HOL-ONLY-3RD-SOURCE-time-daily-5.json  # Holder collection
│       │   ├── issuer-default.json
│       │   └── holder-default.json
│       ├── jurisdictions/           # US GENIUS, EU MiCA params
│       ├── market-scenarios/        # Market stress scenario data
│       ├── compliance-scenarios/    # Compliance scenario data
│       └── profiles/               # Issuer/holder profile configs
├── schemas/
│   ├── issuer-config-schema.json
│   └── holder-config-schema.json
├── dist/                            # Compiled JavaScript output
├── package.json
└── tsconfig.json
```

---

## How Simulation Works

### 1. Frontend sends `POST /api/stablecoin-simulate`

With `entityType` (issuer or holder), `environment` (aws), and threshold values.

### 2. Backend loads the base Postman collection

From `config/stablecoin/defaults/` — either the ISS or HOL collection JSON.

### 3. Backend injects thresholds into the collection

**Issuer**: Patches the request bodies of BackingRatioModel, ComplianceDriftModel, AssetQualityModel, and ConcentrationDriftModel steps.

**Holder**: Overrides collection variables (`cfg_initial_usd`, `cfg_target_usdc`, `cfg_deploy_pct`) and replaces the `isGood`/`isBad` threshold lines in the Daily Portfolio Manager prerequest script.

### 4. SimulationRunner executes the collection

Runs each step sequentially against the ACTUS servers:
- **Risk Factor Service** (`34.203.247.32:8082`) — loads reference indexes, behavioral models, scenarios
- **Simulation Server** (`34.203.247.32:8083`) — runs the actual ACTUS simulation

Two execution modes (auto-detected):
- **SIMPLE** — plain HTTP request chains (no scripts, no folders)
- **SCRIPTED** — full Postman-compatible runner with `{{variable}}` substitution, prerequest/test scripts, `pm.sendRequest()`, and `postman.setNextRequest()` loop control

### 5. Results returned to frontend

Contract events, risk metrics, risk factor data, step execution details, and timing.

---

## ACTUS Server

| Service | URL |
|---------|-----|
| Risk Factor Service | `http://34.203.247.32:8082` |
| Simulation Server | `http://34.203.247.32:8083` |

---

## Features

- **Backing Ratio Verification**: Validates that reserve assets meet or exceed outstanding token obligations
- **Liquidity Ratio Verification**: Ensures sufficient liquid assets for operational requirements
- **Concentration Risk Assessment**: Checks diversification across asset categories
- **Quality Metrics Validation**: Evaluates asset quality based on liquidity scores, credit ratings, and maturity profiles
- **ACTUS Server Integration**: Real-time contract cash flow simulation via ACTUS financial contracts engine
- **vLEI Credential Signing**: Real cryptographic credential issuance via KERIA

---

## Verification Logic

### 1. Backing Ratio
```
Backing Ratio = (Total Reserve Assets / Outstanding Tokens) × 100
Compliant if: Backing Ratio >= Backing Ratio Threshold
```

### 2. Liquidity Ratio
```
Liquidity Ratio = (Highly Liquid Assets / Outstanding Tokens) × 100
Compliant if: Liquidity Ratio >= Liquidity Ratio Threshold
```

### 3. Concentration Risk
```
Concentration Risk = max(Asset Category %) across all categories
Compliant if: Concentration Risk <= Concentration Limit
```

### 4. Asset Quality
```
Quality Score = Weighted average of (Liquidity, Credit, Maturity)
Compliant if: Quality Score >= Quality Threshold
```

---

## Contract Attributes

- `reserveType`: Asset category (cash, treasury, corporate, other)
- `liquidityScore`: Liquidity rating (0-100)
- `creditRating`: Credit quality rating (0-100)
- `maturityDays`: Days to maturity

---

## License

Proprietary - Not Open Source
