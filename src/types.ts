export interface TimingPhases {
  prepare_ms: number;           // Standalone prepare timing
  sign_ms: number;              // Standalone sign timing
  send_ms: number;              // Full sendUserOperation (includes internal prep+sign+send)
  receipt_ms: number;           // Receipt waiting  
  e2e_ms: number;               // Total end-to-end
  pure_send_ms: number;         // Calculated send-only (approximation)
}

export interface BenchmarkTags {
  network: string;
  op_type: 'native_transfer' | 'erc20_transfer' | 'swap_v4' | 'mint';
  sponsored: boolean;
}

export interface BenchmarkConfig extends BenchmarkTags {
  iterations?: number;
  destinationAddress: string;
  amount?: string;
  tokenAddress?: string;
  paymasterUrl?: string;
}

export interface BenchmarkResult {
  timestamp: string;
  timings: TimingPhases;
  tags: BenchmarkTags;
  success: boolean;
  error?: string;
  transactionHash?: string;
  operationHash?: string;
}