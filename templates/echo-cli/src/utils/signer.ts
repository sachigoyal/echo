import { createWalletClient, custom, type WalletClient } from 'viem'
import { mainnet, base, optimism, polygon, arbitrum } from 'viem/chains'
import { getEthereumProvider } from '@/auth'
import { storage } from '@/config'
import type { Signer } from 'x402/types'

const CHAIN_MAP = {
  1: mainnet,
  8453: base,
  10: optimism,
  137: polygon,
  42161: arbitrum
}

export async function createWalletSigner(): Promise<Signer | null> {
  const provider = await getEthereumProvider()
  const session = await storage.getWalletSession()

  if (!provider || !session) {
    return null
  }

  const chain = CHAIN_MAP[session.chainId as keyof typeof CHAIN_MAP]

  if (!chain) {
    return null
  }

  const walletClient: WalletClient = createWalletClient({
    account: session.address as `0x${string}`,
    chain,
    transport: custom(provider)
  })

  return walletClient as unknown as Signer
}
