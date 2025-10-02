import { OpenAIProvider, createOpenAI as createOpenAIBase } from "@ai-sdk/openai";
import { EchoConfig } from "@merit-systems/echo-react-sdk";

export function echoFetch(originalFetch: typeof fetch, paymentAuthHeader: string | null | undefined) {
    return async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers: Record<string, any> = { ...init?.headers };
      if (paymentAuthHeader) {
        headers['x-payment'] = paymentAuthHeader;
      }
      delete headers['Authorization'];
      delete headers['authorization'];
      return originalFetch(input, {
        ...init,
        headers,
      });
    }
  }
  

  export function createX402OpenAI(
    { appId, baseRouterUrl = 
        "http://localhost:3070"
     }: EchoConfig,
    paymentAuthHeader?: string | null,  
  ): OpenAIProvider {
    return createOpenAIBase({
      baseURL: baseRouterUrl,
      apiKey: 'placeholder_replaced_by_echoFetch',
      fetch: echoFetch(
        fetch,
        paymentAuthHeader,
      ),
    });
  }
  

export function UiStreamOnError(): (error: any) => string {
    return (error) => {
        const errorBody = error as { responseBody: string }
        return errorBody.responseBody
    }
}