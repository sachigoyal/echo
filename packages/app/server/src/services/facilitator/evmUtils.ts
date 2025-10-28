import { Network } from './x402-types';
import { createPublicClient, http, Address } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { ERC20_CONTRACT_ABI } from '../fund-repo/constants';

const NETWORK_TO_CHAIN_ID: Record<string, number> = {
  'base': 8453,
  'base-sepolia': 84532,
  'avalanche-fuji': 43113,
  'avalanche': 43114,
  'polygon': 137,
  'polygon-amoy': 80002,
};

const NETWORK_TO_CHAIN = {
  'base': base,
  'base-sepolia': baseSepolia,
};

export function getNetworkId(network: Network): number {
  const chainId = NETWORK_TO_CHAIN_ID[network];
  if (!chainId) {
    throw new Error(`Unsupported network: ${network}`);
  }
  return chainId;
}

export async function getVersion(network: Network): Promise<string> {
  return '2';
}

export async function getERC20Balance(
  network: Network,
  erc20Address: Address,
  userAddress: Address
): Promise<bigint> {
  const chain = NETWORK_TO_CHAIN[network as keyof typeof NETWORK_TO_CHAIN];
  if (!chain) {
    throw new Error(`Unsupported network for balance check: ${network}`);
  }

  const client = createPublicClient({
    chain,
    transport: http(),
  });

  const balance = await client.readContract({
    address: erc20Address,
    abi: ERC20_CONTRACT_ABI,
    functionName: 'balanceOf',
    args: [userAddress],
  }) as bigint;

  return balance;
}

export const USDC_CONFIG: Record<string, { usdcName: string; version: string }> = {
  '8453': { usdcName: 'USD Coin', version: '2' },
  '84532': { usdcName: 'USD Coin', version: '2' },
};

