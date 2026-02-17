#!/usr/bin/env node
/**
 * StableRisk API Server
 * Express server that wraps the verification logic
 */

import express from 'express';
import cors from 'cors';
import { StableCoinVerifier } from './verifier/StableCoinVerifier.js';
import type { VerificationParams, PortfolioConfig } from './types/index.js';

const app = express();
const PORT = 4000;
const DEFAULT_ACTUS_URL = 'http://34.203.247.32:8083/eventsBatch';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', async (_req, res) => {
  try {
    // Check ACTUS connectivity
    let actusConnected = false;
    try {
      const axios = await import('axios');
      await axios.default.get(DEFAULT_ACTUS_URL.replace('/eventsBatch', ''), { timeout: 3000 });
      actusConnected = true;
    } catch {
      actusConnected = false;
    }

    return res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      actusConnected,
      actusUrl: DEFAULT_ACTUS_URL
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Main verification endpoint
app.post('/api/verify', async (req, res) => {
  try {
    const { portfolio, thresholds, actusUrl } = req.body;

    if (!portfolio || !thresholds) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: portfolio, thresholds'
      });
    }

    const portfolioConfig: PortfolioConfig = {
      portfolioMetadata: {
        portfolioId: portfolio.id || 'PORTFOLIO_001',
        totalNotional: portfolio.totalNotional || 0,
        currency: 'USD',
        description: portfolio.description || ''
      },
      contracts: portfolio.contracts || []
    };

    // Save portfolio temporarily
    const fs = await import('fs');
    const path = await import('path');
    const os = await import('os');
    const tempPath = path.join(os.tmpdir(), 'temp-portfolio.json');
    fs.writeFileSync(tempPath, JSON.stringify(portfolioConfig, null, 2));

    const params: VerificationParams = {
      backingRatioThreshold: thresholds.backingRatio || 100,
      liquidityRatioThreshold: thresholds.liquidityRatio || 20,
      concentrationLimit: thresholds.concentrationLimit || 40,
      qualityThreshold: thresholds.assetQuality || 80,
      actusUrl: actusUrl || DEFAULT_ACTUS_URL,
      portfolioPath: tempPath
    };

    console.log('\n🎯 Verification Request');
    console.log('Portfolio:', portfolioConfig.portfolioMetadata.portfolioId);
    console.log('Contracts:', portfolioConfig.contracts.length);
    console.log('Thresholds:', params);

    const verifier = new StableCoinVerifier();
    const result = await verifier.verify(params);

    // Clean up temp file
    try {
      fs.unlinkSync(tempPath);
    } catch {
      // Ignore cleanup errors
    }

    return res.json({
      success: result.success,
      compliant: result.compliant,
      riskMetrics: result.riskMetrics,
      summary: result.summary,
      timestamp: result.timestamp,
      jurisdiction: req.body.jurisdiction || 'custom'
    });

  } catch (error: any) {
    console.error('Verification error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get preset portfolios
app.get('/api/portfolios', async (_req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const configPath = path.join(__dirname, '..', 'config');
    
    if (!fs.existsSync(configPath)) {
      return res.json([]);
    }

    const files = fs.readdirSync(configPath)
      .filter(f => f.startsWith('portfolio-') && f.endsWith('.json'))
      .sort();

    const portfolios = files.map(filename => {
      const content = fs.readFileSync(path.join(configPath, filename), 'utf8');
      const portfolio = JSON.parse(content);
      return {
        id: filename.replace('.json', ''),
        filename,
        portfolio
      };
    });

    return res.json(portfolios);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Get test scenarios
app.get('/api/scenarios', async (_req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const scenariosPath = path.join(__dirname, '..', 'config', 'test-scenarios');
    
    if (!fs.existsSync(scenariosPath)) {
      return res.json([]);
    }

    const files = fs.readdirSync(scenariosPath)
      .filter(f => f.endsWith('.json'))
      .sort();

    const scenarios = files.map(filename => {
      const content = fs.readFileSync(path.join(scenariosPath, filename), 'utf8');
      const portfolio = JSON.parse(content);
      return {
        id: filename.replace('.json', ''),
        filename,
        portfolio
      };
    });

    return res.json(scenarios);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Get threshold presets
app.get('/api/thresholds/:jurisdiction', (req, res) => {
  const jurisdiction = req.params.jurisdiction.toLowerCase();

  const presets: Record<string, any> = {
    'eu-mica': {
      backingRatio: 100,
      liquidityRatio: 30,
      concentrationLimit: 60,
      assetQuality: 85
    },
    'us-genius': {
      backingRatio: 100,
      liquidityRatio: 20,
      concentrationLimit: 40,
      assetQuality: 80
    },
    'custom': {
      backingRatio: 100,
      liquidityRatio: 20,
      concentrationLimit: 40,
      assetQuality: 80
    }
  };

  const preset = presets[jurisdiction] || presets['custom'];
  return res.json(preset);
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 StableRisk API Server');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   Server: http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   ACTUS:  ${DEFAULT_ACTUS_URL}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
