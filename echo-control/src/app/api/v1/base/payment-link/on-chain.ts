import { CdpClient } from '@coinbase/cdp-sdk';
import { encodeFunctionData, Abi } from 'viem';
import {
  MERIT_ABI,
  MERIT_CONTRACT_ADDRESS,
  USDC_ADDRESS,
  GITHUB_REPO_ID,
  ERC20_CONTRACT_ABI,
} from './constants';

export interface FundRepoResult {
  success: boolean;
  userOpHash: string;
  smartAccountAddress: string;
  amount: number;
  repoId: string;
  tokenAddress: string;
}

export async function fundRepo(amount: number): Promise<FundRepoResult> {
  try {
    if (!amount || typeof amount !== 'number') {
      throw new Error('Invalid amount provided');
    }

    if (!GITHUB_REPO_ID || !USDC_ADDRESS || !MERIT_CONTRACT_ADDRESS) {
      throw new Error('Missing required environment variables');
    }

    const repoId = GITHUB_REPO_ID;
    const tokenAddress = USDC_ADDRESS;
    const repoInstanceId = 0;
    // Use Math.ceil for defensive rounding to avoid undercharging
    const amountBigInt = BigInt(Math.ceil(amount * 10 ** 6));

    // CDP wallets
    const cdp = new CdpClient();
    const owner = await cdp.evm.getOrCreateAccount({
      name: 'echo-fund-owner',
    });
    const smartAccount = await cdp.evm.getOrCreateSmartAccount({
      name: 'echo-fund-smart-account',
      owner,
    });
    console.log('Smart account address:', smartAccount.address);

    // Send user operation to fund the repo
    const result = await cdp.evm.sendUserOperation({
      smartAccount,
      network: 'base',
      calls: [
        {
          to: tokenAddress as `0x${string}`,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: ERC20_CONTRACT_ABI as Abi,
            functionName: 'approve',
            args: [MERIT_CONTRACT_ADDRESS, amountBigInt],
          }),
        },
        {
          to: MERIT_CONTRACT_ADDRESS as `0x${string}`,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: MERIT_ABI as Abi,
            functionName: 'fundRepo',
            args: [
              BigInt(repoId),
              BigInt(repoInstanceId),
              tokenAddress,
              amountBigInt,
              '0x',
            ],
          }),
        },
      ],
    });

    // Wait for the user operation to be processed
    await cdp.evm.waitForUserOperation({
      smartAccountAddress: smartAccount.address,
      userOpHash: result.userOpHash,
    });
    console.log('User operation processed successfully');

    return {
      success: true,
      userOpHash: result.userOpHash,
      smartAccountAddress: smartAccount.address,
      amount: amount,
      repoId: repoId,
      tokenAddress: tokenAddress,
    };
  } catch (error) {
    console.error('Error in funding repo:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      amount,
      timestamp: new Date().toISOString(),
    });

    throw error;
  }
}
