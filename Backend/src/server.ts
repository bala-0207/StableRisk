#!/usr/bin/env node
/**
 * StableRisk API Server
 * Express server for Issuer/Holder stablecoin simulation and vLEI credential signing
 */

import express from 'express';
import cors from 'cors';
import simulationRoutes from './routes/simulation.routes.js';
import vleiRoutes from './routes/vlei.routes.js';

const app = express();
const PORT = 4000;
const DEFAULT_ACTUS_URL = 'http://34.203.247.32:8083/eventsBatch';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Register stablecoin simulation routes (issuer + holder)
app.use('/api', simulationRoutes);
// Register vLEI credential signing routes
app.use('/api', vleiRoutes);

// Health check endpoint
app.get('/api/health', async (_req, res) => {
  try {
    let actusConnected = false;
    let actusError = '';
    try {
      const axios = await import('axios');
      const testPayload = {
        contracts: [
          {
            contractType: "PAM",
            contractID: "test_health_check",
            contractRole: "RPA",
            contractDealDate: "2024-01-01T00:00:00",
            initialExchangeDate: "2024-01-01T00:00:00",
            statusDate: "2024-01-01T00:00:00",
            notionalPrincipal: 1000,
            maturityDate: "2024-01-02T00:00:00",
            nominalInterestRate: 0.0,
            currency: "USD",
            dayCountConvention: "A365"
          }
        ],
        riskFactors: []
      };
      
      const response = await axios.default.post(DEFAULT_ACTUS_URL, testPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });
      
      if (response.status === 200 && response.data) {
        actusConnected = true;
      }
    } catch (error: any) {
      actusConnected = false;
      actusError = error.message;
      console.error('ACTUS health check failed:', error.message);
    }

    return res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      actusConnected,
      actusUrl: DEFAULT_ACTUS_URL,
      ...(actusError && { actusError })
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.error('\n🚀 StableRisk API Server');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error(`   Server:        http://localhost:${PORT}`);
  console.error(`   Health:        http://localhost:${PORT}/api/health`);
  console.error(`   ACTUS:         ${DEFAULT_ACTUS_URL}`);
  console.error('  ─────────────── Stablecoin Simulation ───────────────────────');
  console.error(`   Issuer/Holder: POST http://localhost:${PORT}/api/stablecoin-simulate`);
  console.error('  ─────────────── vLEI Credential Signing ─────────────────────');
  console.error(`   VLEI Run:      POST http://localhost:${PORT}/api/vlei/run`);
  console.error(`   VLEI Query:    GET  http://localhost:${PORT}/api/vlei/query`);
  console.error(`   VLEI Status:   GET  http://localhost:${PORT}/api/vlei/status`);
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
