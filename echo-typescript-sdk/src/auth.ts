import * as keytar from 'keytar';

const SERVICE_NAME = 'echo-sdk';
const ACCOUNT_NAME = 'api-key';

export async function storeApiKey(apiKey: string): Promise<void> {
  try {
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, apiKey);
  } catch (error) {
    throw new Error(`Failed to store API key: ${error}`);
  }
}

export async function getStoredApiKey(): Promise<string | null> {
  try {
    const result = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
    return result || null;
  } catch (error) {
    return null;
  }
}

export async function removeStoredApiKey(): Promise<void> {
  try {
    await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
  } catch (error) {
    // Ignore errors when removing
  }
}

export function validateApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  return apiKey.startsWith('echo_') && apiKey.length > 10;
}
