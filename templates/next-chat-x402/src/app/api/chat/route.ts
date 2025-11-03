import { convertToModelMessages, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { openai, getEchoToken } from '@/echo';
import { validateChatRequest } from '@/lib/x402/validate';

export const maxDuration = 30;

const BASE_URL = process.env.BASE_URL || 'https://api.echo.merit.systems/v1';

async function validateAuthentication(useX402: boolean): Promise<{
  token?: string | null;
  error?: Response;
}> {
  if (useX402) {
    return {};
  }

  try {
    const token = await getEchoToken();
    if (!token) {
      return {
        error: new Response(
          JSON.stringify({ error: 'Authentication failed' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ),
      };
    }
    return { token };
  } catch {
    return {
      error: new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }
}

export async function POST(req: Request) {
  try {
    const useX402Header = req.headers.get('use-x402');
    const useX402 = useX402Header === 'true';
    const paymentHeader = req.headers.get('x-payment');
    const body = await req.json();

    const validation = validateChatRequest(body);
    if (!validation.isValid || !validation.data) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: validation.error!.message,
        }),
        {
          status: validation.error!.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { model, messages } = validation.data;

    const authResult = await validateAuthentication(useX402);
    if (authResult.error) {
      return authResult.error;
    }

    if (useX402) {
      const streamFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const headers: Record<string, string> = { ...init?.headers } as Record<string, string>;
        if (paymentHeader) {
          headers['x-payment'] = paymentHeader;
        }
        delete headers['Authorization'];
        
        const response = await fetch(input, {
          ...init,
          headers,
        });

        // If we get a 402, throw an error with the response body
        if (response.status === 402) {
          const errorBody = await response.clone().json();
          const error = new Error('Payment Required') as Error & { status: number; body: unknown };
          error.status = 402;
          error.body = errorBody;
          throw error;
        }

        return response;
      };

      const x402OpenAI = createOpenAI({
        baseURL: BASE_URL,
        apiKey: 'ignore',
        fetch: streamFetch,
      });

      const result = streamText({
        model: x402OpenAI(model),
        messages: convertToModelMessages(messages),
      });

      for await (const part of result.fullStream) {
        switch (part.type) {
          case 'error': {
            const error: any = part.error;
            const status = error.status;
            if (status === 402) {
              return new Response(
                JSON.stringify(error.body),
                { status: 402, headers: { 'Content-Type': 'application/json' } }
              );
            }
            break;
          }
        }
      }

      return result.toUIMessageStreamResponse({
        sendSources: true,
        sendReasoning: true,
      });
    }

    const result = streamText({
      model: openai(model),
      messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse({
      sendSources: true,
      sendReasoning: true,
    });
  } catch (error) {

    if (error && typeof error === 'object' && 'status' in error && error.status === 402) {
      const paymentError = error as { status: number; body: unknown };
      return new Response(
        JSON.stringify(paymentError.body),
        {
          status: 402,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to process chat request',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
