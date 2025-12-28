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

---

*ACTUS Hackathon 2025 | Problem Statements: #3 RegTech/SupTech*
