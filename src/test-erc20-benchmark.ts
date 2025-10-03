import { Erc20TransferBenchmark } from './erc20-transfer-benchmark.js';
import { BenchmarkConfig } from './types.js';

// Test ERC-20 (USDC) transfer benchmark
async function testErc20Benchmark() {
  const benchmark = new Erc20TransferBenchmark();
  
  const config: BenchmarkConfig = {
    network: 'base-sepolia',
    op_type: 'erc20_transfer',
    sponsored: true, // Base-sepolia uses automatic paymaster
    destinationAddress: '0x000000000000000000000000000000000000dEaD', // Burn address
    amount: '0.01', // 0.01 USDC
    tokenAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia USDC
    iterations: 20
  };
  
  console.log('Starting ERC-20 benchmark test with', config.iterations, 'iterations...');
  const result = await benchmark.runBenchmark(config);
  
  console.log('ERC-20 Benchmark result:', {
    success: result.success,
    timings: result.timings,
    error: result.error
  });
}

testErc20Benchmark().catch(console.error);