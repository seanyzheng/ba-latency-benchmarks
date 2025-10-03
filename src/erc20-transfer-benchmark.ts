import { BaseBenchmark, TimingCollector } from './base-benchmark.js';
import { BenchmarkConfig } from './types.js';
import { CdpClient, EvmServerAccount, EvmSmartAccount } from '@coinbase/cdp-sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export class Erc20TransferBenchmark extends BaseBenchmark {
  private cdp: CdpClient | null = null;
  private ownerAccount: EvmServerAccount | null = null;
  private smartAccount: EvmSmartAccount | null = null;
  
  // Setup account once for all transactions
  protected async setupAccount(config: BenchmarkConfig): Promise<void> {
    console.log('Setting up account for ERC-20 transfers...');
    
    // Initialize CDP client
    if (!this.cdp) {
      this.cdp = new CdpClient();
    }
    
    // Create owner account (EVM account that controls the Smart Account)
    this.ownerAccount = await this.cdp.evm.createAccount();
    console.log('Created owner account');
    
    // Create Smart Account with the owner
    this.smartAccount = await this.cdp.evm.createSmartAccount({
      owner: this.ownerAccount,
    });
    console.log('Created Smart Account:', this.smartAccount.address);
    
    // Fund the Smart Account for transfers (if on testnet)
    if (config.network.includes('sepolia')) {
      console.log('Requesting faucet funds for ETH (for gas)...');
      await this.cdp.evm.requestFaucet({
        address: this.smartAccount.address,
        network: config.network as 'base-sepolia',
        token: 'eth',
      });
      
      // Also request USDC for ERC-20 transfers
      if (config.tokenAddress) {
        console.log('Requesting faucet funds for USDC...');
        await this.cdp.evm.requestFaucet({
          address: this.smartAccount.address,
          network: config.network as 'base-sepolia',
          token: 'usdc',
        });
      }
      
      // Wait for funding to be available
      console.log('Waiting for funds to be available...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    console.log('Account setup complete');
  }
  
  protected async executeOperation(config: BenchmarkConfig, timingCollector: TimingCollector): Promise<{
    transactionHash?: string;
    operationHash?: string;
  }> {
    
    if (!this.smartAccount || !this.ownerAccount || !this.cdp) {
      throw new Error('Accounts not initialized');
    }
    
    if (!config.tokenAddress) {
      throw new Error('Token address is required for ERC-20 transfers');
    }
    
    // Convert amount to proper units (USDC has 6 decimals)
    const amount = BigInt(Math.floor(parseFloat(config.amount || '0.01') * 1e6)); // Convert to micro-USDC
    
    // ERC-20 transfer function call data
    // transfer(address to, uint256 amount) = 0xa9059cbb
    const transferData = `0xa9059cbb${
      config.destinationAddress.slice(2).padStart(64, '0')
    }${amount.toString(16).padStart(64, '0')}`;
    
    // Construct ERC-20 transfer call
    const calls = [{
      to: config.tokenAddress as `0x${string}`,
      value: BigInt(0), // No ETH value for ERC-20 transfer
      data: transferData as `0x${string}`,
    }];
    
    // Test A: Standalone prepare timing
    const prepareStart = performance.now();
    const userOp = await this.cdp.evm.prepareUserOperation({
      smartAccount: this.smartAccount,
      network: config.network as 'base-sepolia',
      calls: calls,
    });
    timingCollector.prepare_ms = performance.now() - prepareStart;
    
    // Test B: Standalone sign timing
    const signStart = performance.now();
    await this.ownerAccount.sign({ 
      hash: userOp.userOpHash 
    });
    timingCollector.sign_ms = performance.now() - signStart;
    
    // Test C: Full send + receipt timing
    const e2eStart = performance.now();
    
    // Full sendUserOperation (includes internal prepare+sign+send)
    const sendStart = performance.now();
    const sentUserOp = await this.cdp.evm.sendUserOperation({
      smartAccount: this.smartAccount,
      network: config.network as 'base-sepolia',
      calls: calls,
    });
    timingCollector.send_ms = performance.now() - sendStart;
    
    // Receipt waiting
    const receiptStart = performance.now();
    const receipt = await this.cdp.evm.waitForUserOperation({
      smartAccountAddress: this.smartAccount.address,
      userOpHash: sentUserOp.userOpHash,
    });
    timingCollector.receipt_ms = performance.now() - receiptStart;
    
    // Calculate timings
    timingCollector.e2e_ms = performance.now() - e2eStart;
    
    // Calculate pure send (approximation)
    timingCollector.pure_send_ms = Math.max(0, 
      timingCollector.send_ms - timingCollector.prepare_ms - timingCollector.sign_ms
    );
    
    return {
      transactionHash: receipt.status === 'complete' ? receipt.transactionHash : undefined,
      operationHash: sentUserOp.userOpHash
    };
  }
}