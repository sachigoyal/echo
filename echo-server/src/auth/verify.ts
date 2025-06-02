const auth_key_lookup_table: Record<string, string> = {
  "this-is-a-foolish-attempt-at-authorization": "user-ben-reilly",
}


export async function verifyApiKey(apiKey: string): Promise<string | null> {
  /**
   * Verify the API key
   * 
   * @param apiKey - The API key to verify
   * @returns The user ID if the API key is valid, otherwise null
   */
  // remove bearer
  apiKey = apiKey.replace("Bearer ", "");

  if (apiKey in auth_key_lookup_table) {
    return auth_key_lookup_table[apiKey];
  }
  return null;
}
