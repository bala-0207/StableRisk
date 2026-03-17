# StableRisk

**Deterministic ACTUS Simulations with Risk Factor Analysis for Proactive Stablecoin Liquidity Risk Management**

---

## Overview

StableRisk is a risk management framework that combines deterministic ACTUS contract simulations with risk factor analysis to enable proactive liquidity risk management for stablecoin issuers.

As the stablecoin market expands from 50+ issuers today toward hundreds globally, the verification process remains manual and reactive. Our solution models Liquidity-at-Risk (LaR) across USD-backed and commodity-backed stablecoins with configurable MiCA/GENIUS Act jurisdictional parameters.

---

## Problem

- Current monthly attestations create gaps where reserves can fluctuate without stakeholder knowledge
- Risk identification takes days/weeks after depeg events occur
- No standardized risk metrics across issuers
- Regulatory fragmentation between MiCA (EU) and GENIUS Act (US)

---

## Solution

1. **ACTUS Contract Layer** - Reserve assets encoded using ACTUS contract types (PAM, CLM, STK)
2. **Risk Factor Engine** - Models trained on historical depeg events (UST, USDC/SVB, USDR)
3. **Deterministic Simulation** - Risk factors drive ACTUS stress scenarios
4. **Dual Reporting Layer** - Regulatory reports + internal risk dashboards

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, Recharts, Radix UI, Framer Motion |
| Backend | Node.js, Express 4, TypeScript, Axios |
| Simulation Engine | ACTUS Financial Contracts (external server at `34.203.247.32:8082/8083`) |
| vLEI Signing | KERIA, Docker Compose, tsx-shell (via LegentvLEI) |

---

## Prerequisites

- **Node.js** >= 18.x
- **npm** (comes with Node.js)
- **Docker + Docker Compose** (required only for the vLEI tab)
- **Internet connection** (simulations connect to the ACTUS server at `34.203.247.32`)

---

## Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd StableRisk
```

### 2. Start the Backend

```bash
cd Backend
npm install
npm run build
npm run server
```

You should see:

```
🚀 StableRisk API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Server:        http://localhost:4000
   Health:        http://localhost:4000/api/health
   ACTUS:         http://34.203.247.32:8083/eventsBatch
  ─────────────── Stablecoin Simulation ───────────
   Issuer/Holder: POST http://localhost:4000/api/stablecoin-simulate
  ─────────────── vLEI Credential Signing ─────────
   VLEI Run:      POST http://localhost:4000/api/vlei/run
   VLEI Query:    GET  http://localhost:4000/api/vlei/query
   VLEI Status:   GET  http://localhost:4000/api/vlei/status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3. Start the Frontend

Open a **new terminal**:

```bash
cd Frontend
npm install
npm run dev
```

### 4. Open the app

Go to **http://localhost:3000** in your browser.

---

## Environment Variables

### Frontend (`Frontend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_BASE` | `http://localhost:4000/api` | Backend Express server URL |
| `NEXT_PUBLIC_ACTUS_ENVIRONMENT` | `aws` | ACTUS server environment (`aws` uses `34.203.247.32`) |

---

## Application Tabs

The web UI has 3 functional tabs:

### Issuer Tab

Simulates stablecoin **issuer** risk using ACTUS behavioral models.

- **Regulatory Presets**: US GENIUS Act, EU MiCA, Conservative — one-click to load threshold values
- **Adjustable Thresholds**: Backing ratio, liquidity threshold, WAM max days, bank stress, quality floor, sovereign degradation, max single asset share, HHI warning — all configurable via sliders
- **Simulation**: Sends thresholds to the backend, which injects them into the ACTUS Postman collection (BackingRatioModel, ComplianceDriftModel, AssetQualityModel, ConcentrationDriftModel) and runs the full simulation against the ACTUS server
- **Results**: Risk metrics table (per-day backing, compliance, quality, maturity, concentration, attestation), event charts, contract breakdown, raw JSON

### Holder Tab

Holder simulation is currently under development and will be available in a future release.

### vLEI Tab

Provides **vLEI credential signing** capabilities using KERIA and the GLEIF vLEI ecosystem.

The vLEI integration could not be fully integrated into the continuous simulation workflow within the current release, but the working code for credential issuance, querying, and status checking has been included in the codebase.

- **Run Credential Workflow**: Issues a self-attested credential with a real cryptographic digital signature via KERIA
- **Query Credentials**: Retrieves existing credentials with full signature data
- **Status Check**: Verifies that the required Docker containers are healthy and ready
- **Results**: Displays digital signature details (SAID, AID, schema, registry), workflow execution steps, and the full credential JSON

**vLEI Setup** (required for the vLEI tab only):

```bash
cd LegentvLEI
docker compose up -d
```

Ensure the Docker containers are running before using the vLEI tab.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check — returns ACTUS connection status |
| `POST` | `/api/stablecoin-simulate` | Run issuer or holder stablecoin simulation with threshold overrides |
| `POST` | `/api/vlei/run` | Execute vLEI credential signing workflow |
| `GET` | `/api/vlei/query` | Query existing credentials from KERIA |
| `GET` | `/api/vlei/status` | Check KERIA + vLEI Docker container health |

### Stablecoin Simulate — Request Body

```json
{
  "entityType": "issuer",
  "environment": "aws",
  "issuerThresholds": {
    "backingThreshold": 1.0,
    "liquidityThreshold": 0.2,
    "wamMaxDays": 93,
    "bankStressThreshold": 0.5,
    "baseQuality": 100,
    "qualityFloor": 50,
    "sovereignMaxDegradation": 0.30,
    "maxSingleAssetShare": 0.40,
    "hhiWarningThreshold": 0.35
  }
}
```

For holder simulations, pass `"entityType": "holder"` with `holderPortfolio`, `holderGood`, and `holderBad` objects instead.

---

## ACTUS Server

All simulations run against a remote ACTUS Financial Contracts server:

| Service | URL |
|---------|-----|
| Risk Factor Service | `http://34.203.247.32:8082` |
| Simulation Server | `http://34.203.247.32:8083` |

🔗 **ACTUS Risk Extension Server**: [github.com/bala-0207/ACTUS-RISK-EXTENSION](https://github.com/bala-0207/ACTUS-RISK-EXTENSION.git) — Source code and documentation for the ACTUS risk factor service and simulation server used by StableRisk.

The backend's SimulationRunner executes Postman collection JSONs (stored in `Backend/config/stablecoin/defaults/`) step-by-step against these servers. It supports two modes:

- **SIMPLE mode** — plain HTTP request chains (no scripts)
- **SCRIPTED mode** — full Postman-compatible runner with variable substitution, prerequest/test scripts, `pm.sendRequest()`, and `postman.setNextRequest()` loop control

---

## Regulatory Threshold Definitions

This repository contains the first cut of regulatory threshold definitions for stablecoin compliance verification. These files establish the foundational rules against which stablecoin portfolios will be evaluated.

### Current Threshold Files

| File | Description |
|------|-------------|
| **EU-Professional-Thresholds.json** | First cut of MiCA (EU Regulation 2023/1114, Articles 36-40) regulatory rules including backing ratio, liquidity requirements, concentration limits, quality thresholds, and allowed/prohibited asset definitions. |
| **US-Professional-Thresholds.json** | First cut of GENIUS Act (S. 1582, Section 4(a)) regulatory rules including backing ratio, liquidity requirements, concentration limits, quality thresholds, and maturity restrictions. |

### Roadmap

These threshold definitions serve as the foundation. Test case files, validation logic, and other implementation code will be generated in subsequent iterations.

---

## Architecture
```
================================================================================
                                StableRisk
          Deterministic ACTUS Simulations with Risk Factor Analysis
            for Proactive Stablecoin Liquidity Risk Management
================================================================================


                        ┌─────────────────────────────────────────┐
                        │    External Stablecoin Ecosystem        │
                        │  (Issuers, Market Data APIs, Reserve    │
                        │   Attestations, On-Chain Data,          │
                        │   Treasury Rates, Commodity Prices)     │
                        └─────────────────────────────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────────────┐
                        │   Data Ingestion & Preprocessing Layer  │
                        │  (ETL Pipeline, Stream Processing,      │
                        │   Data Validation, Normalization,       │
                        │   Feature Engineering)                  │
                        └─────────────────────────────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────────────┐
                        │       Risk Factor Analysis Engine       │
                        │  (Statistical Models, Ensemble Methods, │
                        │   Depeg Pattern Recognition,            │
                        │   Risk Scoring 0-100)                   │
                        └─────────────────────────────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────────────┐
                        │      ACTUS Contract Modeling Layer      │
                        │        Standard ACTUS Contract Types    │
                        │        (PAM, CLM, STK, Composite)       │
                        └─────────────────────────────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────────────┐
                        │    ACTUS Engine & Cash Flow Generator   │
                        │  (Event Schedule Creation, Cash Flow    │
                        │   Calculation, Scenario & Stress        │            
                        │   Execution, Portfolio Aggregation)     │
                        └─────────────────────────────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────────────┐
                        │  Downstream Financial & RegTech Systems │
                        │                                         │
                        │  • Risk Management (Liquidity/Market)   │
                        │  • Regulatory Reporting (MiCA/GENIUS)   │
                        │  • Audit & Attestation Platforms        │
                        │  • Real-time Dashboard & Alerts         │
                        └─────────────────────────────────────────┘



================================================================================
                            SYSTEM ARCHITECTURE
================================================================================


    ┌────────────────────────┐          ┌────────────────────────────────┐
    │  Jurisdictional        │          │                                │
    │  Configuration         │─ ─ ─ ─ ─▶│  Configurable Parameters       │
    │                        │          │                                │
    │  • MiCA (EU)           │          │  • Reserve Haircuts            │
    │    30-60% EU Banks     │          │  • Liquidity Buffers           │
    │    Longer Maturities   │          │  • Stress Scenarios            │
    │                        │          │  • Compliance Thresholds       │
    │  • GENIUS Act (US)     │          │                                │
    │    100% HQLA           │          └────────────────────────────────┘
    │    T-Bills Only        │                        │
    │    Monthly Attestation │                        │
    └────────────────────────┘                        │
              │                                       │
              │                                       │
              ▼                                       ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │                                                                     │
    │                    ACTUS SIMULATION CORE                            │
    │                                                                     │
    │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
    │  │ Contract Parser │  │ Cash Flow Engine│  │ Scenario Generator  │  │
    │  │                 │  │                 │  │                     │  │
    │  │ • PAM (T-Bills) │  │ • Deterministic │  │ • Stress Testing    │  │
    │  │ • CLM (MM)      │  │   Projections   │  │ • Monte Carlo       │  │
    │  │ • STK (Tokens)  │  │ • Maturity      │  │ • Shock Simulation  │  │
    │  │                 │  │   Scheduling    │  │                     │  │
    │  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │
    │                                                                     │
    └─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                   ┌─────────────────────────────────┐
                   │                                 │
                   │     LIQUIDITY-AT-RISK (LaR)     │
                   │                                 │
                   │   USD-backed & Commodity-backed │
                   │         Stablecoins             │
                   │                                 │
                   │   95th/99th Percentile          │
                   │   1-day / 7-day / 30-day        │
                   │                                 │
                   └─────────────────────────────────┘



================================================================================
                     EXAMPLE - Depeg Risk Assessment Flow
================================================================================


                           Market Data Input
                                  │
                                  ▼
                         Price Volatility Index
                                  │
                                  ▼
                       Risk Factor Analysis
                                  │
                                  ▼
                         ACTUS PAM Contract
                                  │
                                  ▼
                      Stress Scenario Execution
                                  │
                                  ▼
                     Liquidity-at-Risk Calculation
                                  │
                                  ▼
                      Risk & Regulatory Reporting



================================================================================
                              KEY METRICS
================================================================================

    ┌────────────────────────────────────────────────────────────────────┐
    │                                                                    │
    │   Market Opportunity                                               │
    │   ├── TAM: $310B+ stablecoin market                               │
    │   ├── SAM: $230B+ regulated stablecoins                           │
    │   └── SOM: $50B+ mid-tier issuers (Year 1)                        │
    │                                                                    │
    │   Operational Impact                                               │
    │   ├── Risk Detection: Days/Weeks → Minutes                        │
    │   ├── Compliance Cost: 60-70% Reduction                           │
    │   └── Planning: Reactive → Proactive                              │
    │                                                                    │
    │   Coverage                                                         │
    │   ├── USD-backed: USDT, USDC, PYUSD, RLUSD                        │
    │   └── Commodity-backed: PAXG, XAUT (Gold)                         │
    │                                                                    │
    └────────────────────────────────────────────────────────────────────┘
```

---

## Impact

| Metric | Improvement |
|--------|-------------|
| Risk Detection | Days/Weeks → Minutes |
| Compliance Cost | 60-70% Reduction |
| Planning | Reactive → Proactive |

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

📁 **For More Information:** [View Project Documentation](https://drive.google.com/drive/folders/1SQX67fkzU9bGo4fQ8dImnYIEdUVFlSI4?usp=sharing)

## Project Repository

🔗 **Code Repository:** [Link to be added]

---

## Contact

📧 **Email:** gopalbala0205@gmail.com

---

## License

**Proprietary - Not Open Source**

This project is proprietary software. All rights reserved. Unauthorized copying, modification, distribution, or use of this software is strictly prohibited.

> **Note:** This repository will be converted to a private repository in 4 weeks. If you need access after that, please contact the author.

---

*ACTUS Hackathon 2025 | Problem Statements: #3 RegTech/SupTech*
