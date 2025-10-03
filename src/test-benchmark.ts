import { NativeTransferBenchmark } from './native-transfer-benchmark.js';
import { BenchmarkConfig } from './types.js';

// Test with multiple transactions to get averaged results
async function testBenchmark() {
  const benchmark = new NativeTransferBenchmark();
  
  const config: BenchmarkConfig = {
    network: 'base-sepolia',
    op_type: 'native_transfer',
    sponsored: true, // Base-sepolia uses automatic paymaster
    destinationAddress: '0x000000000000000000000000000000000000dEaD', // Burn address
    amount: '0.000001', 
    iterations: 20 
  };
  
  console.log('Starting benchmark test with', config.iterations, 'iterations...');
  const result = await benchmark.runBenchmark(config);
  
  console.log('Benchmark result:', {
    success: result.success,
    timings: result.timings,
    error: result.error
  });
}

testBenchmark().catch(console.error);