/**
 * Metric Calculation Utilities
 * Based on patterns from RiskLiquidityStableCoinOptimMerkleUtils.ts
 */

import type {
  ACTUSContract,
  ACTUSResponse,
  StableCoinRiskData,
  ReserveComponents,
  QualityMetrics,
  RiskMetrics
} from '../types/index.js';

/**
 * Process ACTUS response into StableCoin risk data structure
 */
export function processStableCoinData(
  actusResponse: ACTUSResponse,
  contracts: ACTUSContract[],
  backingRatioThreshold: number,
  liquidityRatioThreshold: number,
  concentrationLimit: number,
  qualityThreshold: number
): StableCoinRiskData {
  console.log('\n📊 Processing StableCoin data...');

  // If ACTUS returns 0 periods, default to 12 months
  let periodsCount = actusResponse.periodsCount;
  if (periodsCount === 0) {
    console.log('   \u26a0\ufe0f  ACTUS returned 0 periods, defaulting to 12 months');
    periodsCount = 12;
  }

  // Aggregate cash flows across all contracts
  const aggregatedInflows = new Array(periodsCount).fill(0);
  const aggregatedOutflows = new Array(periodsCount).fill(0);

  for (let i = 0; i < actusResponse.inflow.length && i < contracts.length; i++) {
    const contractInflows = actusResponse.inflow[i] || [];
    const contractOutflows = actusResponse.outflow[i] || [];

    for (let period = 0; period < periodsCount; period++) {
      aggregatedInflows[period] += contractInflows[period] || 0;
      aggregatedOutflows[period] += contractOutflows[period] || 0;
    }
  }

  // Calculate total liabilities (outstanding tokens)
  const totalLiabilities = contracts
    .filter(c => c.contractRole === 'RPL')
    .reduce((sum, c) => sum + Math.abs(parseFloat(c.notionalPrincipal)), 0);

  console.log(`   Total Liabilities (Outstanding Tokens): ${totalLiabilities.toFixed(2)}`);

  const outstandingTokens = new Array(periodsCount).fill(totalLiabilities);
  const tokenValue = 1.0; // Assume $1 per token

  // Categorize reserves by type
  const reserveComponents = categorizeReserves(contracts, periodsCount);

  // Calculate quality metrics
  const qualityMetrics = calculateQualityMetrics(contracts);

  return {
    companyID: 'STABLECOIN_10001',
    companyName: 'StableCoin Reserve Assessment',
    cashInflow: aggregatedInflows,
    cashOutflow: aggregatedOutflows,
    periodsCount,
    reserveComponents,
    outstandingTokens,
    tokenValue,
    qualityMetrics,
    backingRatioThreshold,
    liquidityRatioThreshold,
    concentrationLimit,
    qualityThreshold
  };
}

/**
 * Categorize reserves into cash, treasury, corporate, and other
 */
function categorizeReserves(
  contracts: ACTUSContract[],
  periodsCount: number
): ReserveComponents {
  const cashReserves = new Array(periodsCount).fill(0);
  const treasuryReserves = new Array(periodsCount).fill(0);
  const corporateReserves = new Array(periodsCount).fill(0);
  const otherReserves = new Array(periodsCount).fill(0);
  const totalReserves = new Array(periodsCount).fill(0);

  // Process asset contracts (RPA role)
  contracts.forEach((contract) => {
    if (contract.contractRole !== 'RPA') return;

    const principal = Math.abs(parseFloat(contract.notionalPrincipal));
    const reserveType = contract.reserveType || 'other';

    // Categorize based on reserve type
    for (let period = 0; period < periodsCount; period++) {
      switch (reserveType) {
        case 'cash':
          cashReserves[period] += principal;
          break;
        case 'treasury':
          treasuryReserves[period] += principal;
          break;
        case 'corporate':
          corporateReserves[period] += principal;
          break;
        default:
          otherReserves[period] += principal;
      }
      totalReserves[period] += principal;
    }
  });

  if (periodsCount > 0) {
    console.log(`   Cash Reserves: ${cashReserves[0].toFixed(2)}`);
    console.log(`   Treasury Reserves: ${treasuryReserves[0].toFixed(2)}`);
    console.log(`   Corporate Reserves: ${corporateReserves[0].toFixed(2)}`);
    console.log(`   Other Reserves: ${otherReserves[0].toFixed(2)}`);
    console.log(`   Total Reserves: ${totalReserves[0].toFixed(2)}`);
  } else {
    console.log(`   ⚠️  No periods returned from ACTUS - using static principal values`);
  }

  return {
    cashReserves,
    treasuryReserves,
    corporateReserves,
    otherReserves,
    totalReserves
  };
}

/**
 * Calculate quality metrics from contract attributes
 */
function calculateQualityMetrics(contracts: ACTUSContract[]): QualityMetrics {
  const assetContracts = contracts.filter(c => c.contractRole === 'RPA');

  // Aggregate by reserve type
  const categories = {
    cash: { total: 0, liquiditySum: 0, creditSum: 0, maturitySum: 0, count: 0 },
    treasury: { total: 0, liquiditySum: 0, creditSum: 0, maturitySum: 0, count: 0 },
    corporate: { total: 0, liquiditySum: 0, creditSum: 0, maturitySum: 0, count: 0 },
    other: { total: 0, liquiditySum: 0, creditSum: 0, maturitySum: 0, count: 0 }
  };

  assetContracts.forEach(contract => {
    const principal = Math.abs(parseFloat(contract.notionalPrincipal));
    const reserveType = (contract.reserveType || 'other') as keyof typeof categories;
    const category = categories[reserveType];

    category.total += principal;
    category.liquiditySum += (contract.liquidityScore || 50) * principal;
    category.creditSum += (contract.creditRating || 50) * principal;
    category.maturitySum += (contract.maturityDays || 365) * principal;
    category.count++;
  });

  // Calculate weighted averages for each category
  const liquidityScores: number[] = [];
  const creditRatings: number[] = [];
  const maturityProfiles: number[] = [];

  ['cash', 'treasury', 'corporate', 'other'].forEach(type => {
    const category = categories[type as keyof typeof categories];
    if (category.total > 0) {
      liquidityScores.push(category.liquiditySum / category.total);
      creditRatings.push(category.creditSum / category.total);
      maturityProfiles.push(category.maturitySum / category.total);
    } else {
      liquidityScores.push(0);
      creditRatings.push(0);
      maturityProfiles.push(0);
    }
  });

  // Calculate overall asset quality score
  const weights = [0.4, 0.3, 0.2, 0.1]; // Weight: liquidity > credit > maturity
  const assetQualityScore = liquidityScores.reduce((sum, score, i) => 
    sum + score * weights[i], 0
  );

  return {
    liquidityScores,
    creditRatings,
    maturityProfiles,
    assetQualityScore
  };
}

/**
 * Calculate risk metrics from StableCoin data
 */
export function calculateRiskMetrics(data: StableCoinRiskData): RiskMetrics {
  console.log('\n📈 Calculating risk metrics...');

  const periodsCount = data.periodsCount;
  const backingRatios: number[] = [];
  const liquidityRatios: number[] = [];
  const concentrationRisks: number[] = [];
  const assetQualityScores: number[] = [];

  for (let period = 0; period < periodsCount; period++) {
    const totalReserves = data.reserveComponents.totalReserves[period];
    const outstandingTokens = data.outstandingTokens[period];
    const cashReserves = data.reserveComponents.cashReserves[period];
    const treasuryReserves = data.reserveComponents.treasuryReserves[period];

    // 1. Backing Ratio = (Total Reserves / Outstanding Tokens) * 100
    const backingRatio = outstandingTokens > 0 
      ? (totalReserves / outstandingTokens) * 100 
      : 0;
    backingRatios.push(backingRatio);

    // 2. Liquidity Ratio = (Highly Liquid Assets / Outstanding Tokens) * 100
    const highlyLiquidAssets = cashReserves + treasuryReserves;
    const liquidityRatio = outstandingTokens > 0 
      ? (highlyLiquidAssets / outstandingTokens) * 100 
      : 0;
    liquidityRatios.push(liquidityRatio);

    // 3. Concentration Risk = max percentage in any single category
    const cashPct = totalReserves > 0 ? (cashReserves / totalReserves) * 100 : 0;
    const treasuryPct = totalReserves > 0 ? (treasuryReserves / totalReserves) * 100 : 0;
    const corporatePct = totalReserves > 0 ? (data.reserveComponents.corporateReserves[period] / totalReserves) * 100 : 0;
    const otherPct = totalReserves > 0 ? (data.reserveComponents.otherReserves[period] / totalReserves) * 100 : 0;
    
    const concentrationRisk = Math.max(cashPct, treasuryPct, corporatePct, otherPct);
    concentrationRisks.push(concentrationRisk);

    // 4. Asset Quality Score (from quality metrics)
    assetQualityScores.push(data.qualityMetrics.assetQualityScore);
  }

  // Calculate aggregated metrics
  const averageBackingRatio = backingRatios.reduce((sum, v) => sum + v, 0) / periodsCount;
  const averageLiquidityRatio = liquidityRatios.reduce((sum, v) => sum + v, 0) / periodsCount;
  const maxConcentrationRisk = Math.max(...concentrationRisks);
  const averageAssetQuality = assetQualityScores.reduce((sum, v) => sum + v, 0) / periodsCount;

  // Check compliance
  const backingCompliant = backingRatios.every(r => r >= data.backingRatioThreshold);
  const liquidityCompliant = liquidityRatios.every(r => r >= data.liquidityRatioThreshold);
  const concentrationCompliant = concentrationRisks.every(r => r <= data.concentrationLimit);
  const qualityCompliant = averageAssetQuality >= data.qualityThreshold;
  const overallCompliant = backingCompliant && liquidityCompliant && concentrationCompliant && qualityCompliant;

  console.log(`   Average Backing Ratio: ${averageBackingRatio.toFixed(2)}%`);
  console.log(`   Average Liquidity Ratio: ${averageLiquidityRatio.toFixed(2)}%`);
  console.log(`   Max Concentration Risk: ${maxConcentrationRisk.toFixed(2)}%`);
  console.log(`   Asset Quality Score: ${averageAssetQuality.toFixed(2)}`);

  return {
    backingRatios,
    liquidityRatios,
    concentrationRisks,
    assetQualityScores,
    averageBackingRatio,
    averageLiquidityRatio,
    maxConcentrationRisk,
    averageAssetQuality,
    backingCompliant,
    liquidityCompliant,
    concentrationCompliant,
    qualityCompliant,
    overallCompliant
  };
}
