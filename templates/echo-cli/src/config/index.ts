import { Storage, StorageType } from './store'
import { ApiKeySchema, ModelSchema, AuthMethodSchema, WalletConnectSessionSchema, validate } from '@/validation'
import { DEFAULT_MODEL } from './models'
import type { Model, AuthMethod, WalletConnectSession } from '@/validation'

class EchodexStorage extends Storage {
  constructor() {
    super({
      serviceName: 'echodex',
      configName: 'echodex'
    })
  }

  async getApiKey(): Promise<string | undefined> {
    return this.get<string>('apiKey', { 
      type: StorageType.SECURE,
      schema: ApiKeySchema
    })
  }

  async setApiKey(apiKey: string): Promise<void> {
    const validatedKey = validate(ApiKeySchema, apiKey)
    await this.set('apiKey', validatedKey, { type: StorageType.SECURE })
  }

  async deleteApiKey(): Promise<void> {
    await this.delete('apiKey', StorageType.SECURE)
  }

  async hasApiKey(): Promise<boolean> {
    return this.has('apiKey', StorageType.SECURE)
  }

  async getAuthMethod(): Promise<AuthMethod | undefined> {
    return this.get<AuthMethod>('authMethod', {
      type: StorageType.NORMAL,
      schema: AuthMethodSchema
    })
  }

  async setAuthMethod(method: AuthMethod): Promise<void> {
    const validatedMethod = validate(AuthMethodSchema, method)
    await this.set('authMethod', validatedMethod, { type: StorageType.NORMAL })
  }

  async deleteAuthMethod(): Promise<void> {
    await this.delete('authMethod', StorageType.NORMAL)
  }

  async getWalletSession(): Promise<WalletConnectSession | undefined> {
    return this.get<WalletConnectSession>('walletSession', {
      type: StorageType.NORMAL,
      schema: WalletConnectSessionSchema
    })
  }

  async setWalletSession(session: WalletConnectSession): Promise<void> {
    const validatedSession = validate(WalletConnectSessionSchema, session)
    await this.set('walletSession', validatedSession, { type: StorageType.NORMAL })
  }

  async deleteWalletSession(): Promise<void> {
    await this.delete('walletSession', StorageType.NORMAL)
  }

  async hasWalletSession(): Promise<boolean> {
    return this.has('walletSession', StorageType.NORMAL)
  }

  async isAuthenticated(): Promise<boolean> {
    const method = await this.getAuthMethod()
    if (!method) return false
    
    if (method === 'echo') {
      return this.hasApiKey()
    } else {
      return this.hasWalletSession()
    }
  }

  async getModel(): Promise<Model> {
    const model = await this.get<Model>('model', {
      type: StorageType.NORMAL,
      schema: ModelSchema
    })
    return model ?? DEFAULT_MODEL
  }

  async setModel(model: Model): Promise<void> {
    const validatedModel = validate(ModelSchema, model)
    await this.set('model', validatedModel, { type: StorageType.NORMAL })
  }
}

export const storage = new EchodexStorage()
export { StorageType, StorageAdapter } from './store'
