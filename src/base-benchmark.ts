import { BenchmarkConfig, BenchmarkResult, TimingPhases } from './types.js';

// Helper class to collect timing data progressively
export class TimingCollector {
  prepare_ms: number = 0;           // Standalone prepare timing
  sign_ms: number = 0;              // Standalone sign timing  
  send_ms: number = 0;              // Full sendUserOperation (includes internal prep+sign+send)
  receipt_ms: number = 0;           // Receipt waiting
  e2e_ms: number = 0;               // Total end-to-end
  pure_send_ms: number = 0;         // Calculated send-only (approximation)

  // Helper method to get current timings
  getTimings(): TimingPhases {
    return {
      prepare_ms: this.prepare_ms,
      sign_ms: this.sign_ms,
      send_ms: this.send_ms,
      receipt_ms: this.receipt_ms,
      e2e_ms: this.e2e_ms,
      pure_send_ms: this.pure_send_ms
    };
  }
}

export abstract class BaseBenchmark {
  
  // Abstract method for account setup (implemented by each subclass)
  protected abstract setupAccount(config: BenchmarkConfig): Promise<void>;
  
  // Abstract method that each operation type must implement
  // Takes a timing collector that can be updated progressively
  protected abstract executeOperation(
    config: BenchmarkConfig, 
    timingCollector: TimingCollector
  ): Promise<{
    transactionHash?: string;
    operationHash?: string;
  }>;
  
  async runBenchmark(config: BenchmarkConfig): Promise<BenchmarkResult> {
    const iterations = config.iterations || 1;
    const results: TimingPhases[] = [];
    let lastTransactionHash: string | undefined;
    let lastOperationHash: string | undefined;
    
    // Setup account once before all iterations
    await this.setupAccount(config);
    
    console.log(`Running ${iterations} iterations...`);
    
    for (let i = 0; i < iterations; i++) {
      console.log(`Iteration ${i + 1}/${iterations}`);
      const timingCollector = new TimingCollector();
      
      try {
        const operationResult = await this.executeOperation(config, timingCollector);
        results.push(timingCollector.getTimings());
        lastTransactionHash = operationResult.transactionHash;
        lastOperationHash = operationResult.operationHash;
        
        // Brief pause between iterations to avoid rate limits
        if (i < iterations - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.log(`Iteration ${i + 1} failed:`, error instanceof Error ? error.message : String(error));
        // Continue with other iterations
      }
    }
    
    if (results.length === 0) {
      return {
        timestamp: new Date().toISOString(),
        timings: new TimingCollector().getTimings(),
        tags: {
          network: config.network,
          op_type: config.op_type,
          sponsored: config.sponsored
        },
        success: false,
        error: 'All iterations failed'
      };
    }
    
    // Calculate averaged timings
    const avgTimings = this.calculateAverageTimings(results);
    
    return {
      timestamp: new Date().toISOString(),
      timings: avgTimings,
      tags: {
        network: config.network,
        op_type: config.op_type,
        sponsored: config.sponsored
      },
      success: true,
      transactionHash: lastTransactionHash,
      operationHash: lastOperationHash
    };
  }
  
  private calculateAverageTimings(results: TimingPhases[]): TimingPhases {
    const avg = {
      prepare_ms: 0,
      sign_ms: 0,
      send_ms: 0,
      receipt_ms: 0,
      e2e_ms: 0,
      pure_send_ms: 0
    };
    
    for (const result of results) {
      avg.prepare_ms += result.prepare_ms;
      avg.sign_ms += result.sign_ms;
      avg.send_ms += result.send_ms;
      avg.receipt_ms += result.receipt_ms;
      avg.e2e_ms += result.e2e_ms;
      avg.pure_send_ms += result.pure_send_ms;
    }
    
    const count = results.length;
    return {
      prepare_ms: Math.round((avg.prepare_ms / count) * 100) / 100,
      sign_ms: Math.round((avg.sign_ms / count) * 100) / 100,
      send_ms: Math.round((avg.send_ms / count) * 100) / 100,
      receipt_ms: Math.round((avg.receipt_ms / count) * 100) / 100,
      e2e_ms: Math.round((avg.e2e_ms / count) * 100) / 100,
      pure_send_ms: Math.round((avg.pure_send_ms / count) * 100) / 100
    };
  }
}