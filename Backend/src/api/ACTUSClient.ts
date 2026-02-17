/**
 * ACTUS Server Client
 * Handles communication with ACTUS server for cash flow data
 */

import axios from 'axios';
import type { ACTUSContract, ACTUSRequestData, ACTUSResponse } from '../types/index.js';

export class ACTUSClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Parse ACTUS events into period-based cash flows
   */
  private parseACTUSEvents(actusResults: any[], contracts: ACTUSContract[]): ACTUSResponse {
    const periods = 12; // Default to 12 months
    const inflows: number[][] = [];
    const outflows: number[][] = [];

    // Initialize arrays for each contract
    for (let i = 0; i < contracts.length; i++) {
      inflows[i] = new Array(periods).fill(0);
      outflows[i] = new Array(periods).fill(0);
    }

    // Process each contract's events
    actusResults.forEach((result: any, contractIndex: number) => {
      if (!result.events || result.status !== 'Success') return;

      const contract = contracts[contractIndex];
      const isAsset = contract.contractRole === 'RPA';

      result.events.forEach((event: any) => {
        // Parse event time to determine period
        const eventDate = new Date(event.time);
        const startDate = new Date(contract.statusDate || contract.contractDealDate);
        const monthsDiff = this.getMonthsDifference(startDate, eventDate);
        
        if (monthsDiff >= 0 && monthsDiff < periods) {
          const payoff = parseFloat(event.payoff || 0);
          
          // For assets (RPA): positive payoff = inflow, negative = outflow
          // For liabilities (RPL): positive payoff = outflow, negative = inflow
          if (isAsset) {
            if (payoff > 0) {
              inflows[contractIndex][monthsDiff] += payoff;
            } else {
              outflows[contractIndex][monthsDiff] += Math.abs(payoff);
            }
          } else {
            if (payoff > 0) {
              outflows[contractIndex][monthsDiff] += payoff;
            } else {
              inflows[contractIndex][monthsDiff] += Math.abs(payoff);
            }
          }
        }
      });
    });

    return {
      inflow: inflows,
      outflow: outflows,
      periodsCount: periods,
      contractDetails: actusResults,
      riskMetrics: {},
      metadata: {
        timeHorizon: 'monthly',
        currency: 'USD',
        processingDate: new Date().toISOString()
      }
    };
  }

  /**
   * Calculate months difference between two dates
   */
  private getMonthsDifference(start: Date, end: Date): number {
    const yearsDiff = end.getFullYear() - start.getFullYear();
    const monthsDiff = end.getMonth() - start.getMonth();
    return yearsDiff * 12 + monthsDiff;
  }

  /**
   * Call ACTUS API with contract portfolio
   */
  async fetchCashFlowData(contracts: ACTUSContract[]): Promise<ACTUSResponse> {
    console.log(`🌐 Calling ACTUS server: ${this.baseUrl}`);
    console.log(`📋 Processing ${contracts.length} contracts`);

    // Clean contracts before sending (remove non-ACTUS fields)
    const cleanedContracts = contracts.map(contract => {
      const { reserveType, liquidityScore, creditRating, maturityDays, ...cleanContract } = contract;
      return cleanContract;
    });

    const requestData: ACTUSRequestData = {
      contracts: cleanedContracts,
      riskFactors: []
    };

    // Log first contract for debugging
    if (cleanedContracts.length > 0) {
      console.log('📤 Sample contract sent to ACTUS:');
      console.log(JSON.stringify(cleanedContracts[0], null, 2));
    }

    try {
      const response = await axios.post(this.baseUrl, requestData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      const jsonData = response.data;

      // Log full ACTUS response for debugging
      console.log('📥 ACTUS Response:', JSON.stringify(jsonData, null, 2).substring(0, 1000));

      // Parse ACTUS events format into period-based cash flows
      const actusResponse = this.parseACTUSEvents(jsonData, contracts);

      console.log(`✅ ACTUS data retrieved successfully`);
      console.log(`   Periods: ${actusResponse.periodsCount}`);
      console.log(`   Inflow arrays: ${actusResponse.inflow.length}`);
      console.log(`   Outflow arrays: ${actusResponse.outflow.length}`);

      return actusResponse;

    } catch (error: any) {
      console.error('❌ ACTUS API call failed:', error.message);
      
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Data:`, error.response.data);
      } else if (error.request) {
        console.error('   No response received from server');
        console.error('   Please ensure ACTUS server is running');
      }
      
      throw new Error(`ACTUS API call failed: ${error.message}`);
    }
  }

  /**
   * Load portfolio from JSON file
   */
  static async loadPortfolio(portfolioPath: string): Promise<ACTUSContract[]> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const fullPath = path.resolve(portfolioPath);
      
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Portfolio file not found: ${fullPath}`);
      }

      const fileContent = fs.readFileSync(fullPath, 'utf8');
      const portfolioConfig = JSON.parse(fileContent);

      if (!portfolioConfig.contracts || !Array.isArray(portfolioConfig.contracts)) {
        throw new Error('Invalid portfolio format: missing contracts array');
      }

      console.log(`📁 Loaded portfolio from: ${portfolioPath}`);
      if (portfolioConfig.portfolioMetadata) {
        console.log(`   Portfolio ID: ${portfolioConfig.portfolioMetadata.portfolioId}`);
        console.log(`   Total Notional: ${portfolioConfig.portfolioMetadata.totalNotional}`);
        console.log(`   Currency: ${portfolioConfig.portfolioMetadata.currency}`);
      }
      console.log(`   Contracts: ${portfolioConfig.contracts.length}`);

      return portfolioConfig.contracts;

    } catch (error: any) {
      console.error(`❌ Failed to load portfolio:`, error.message);
      throw error;
    }
  }
}
