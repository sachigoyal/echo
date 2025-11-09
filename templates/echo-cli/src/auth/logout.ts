import { storage } from '@/config'
import { clearEchoClient } from './client'
import { clearEthereumProvider } from './wallet'
import { success, warning } from '@/print'

export async function logout(): Promise<void> {
  const authMethod = await storage.getAuthMethod()
  
  if (!authMethod) {
    warning('Not currently authenticated')
    return
  }
  
  await storage.deleteApiKey()
  await storage.deleteWalletSession()
  await storage.deleteAuthMethod()
  
  clearEchoClient()
  clearEthereumProvider()
  
  success('✓ Successfully logged out and cleared all credentials')
}
