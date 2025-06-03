interface ApiKeyValidationResponse {
  valid: boolean;
  userId?: string;
  echoAppId?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  echoApp?: {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
  };
  error?: string;
}

export async function verifyApiKey(apiKey: string): Promise<string | null> {
  /**
   * Verify the API key by calling the echo-control validation endpoint
   * 
   * @param apiKey - The API key to verify
   * @returns The user ID if the API key is valid, otherwise null
   */
  try {
    // Remove bearer prefix if present
    const cleanApiKey = apiKey.replace("Bearer ", "");

    const echoControlUrl = process.env.ECHO_CONTROL_URL || 'http://localhost:3000';
    
    const response = await fetch(`${echoControlUrl}/api/validate-api-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: cleanApiKey
      })
    });

    if (!response.ok) {
      console.error('API key validation failed:', response.status, response.statusText);
      return null;
    }

    const data: ApiKeyValidationResponse = await response.json();

    if (data.valid && data.userId) {
      return data.userId;
    }

    return null;
  } catch (error) {
    console.error('Error verifying API key:', error);
    return null;
  }
}
