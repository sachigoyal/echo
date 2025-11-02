import { convertToModelMessages, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { openai, getEchoToken } from '@/echo';
import { validateChatRequest } from '@/lib/x402/validate';

export const maxDuration = 30;

const BASE_URL = process.env.BASE_URL || 'https://api.echo.merit.systems/v1';

function echoFetch(paymentAuthHeader: string | null | undefined) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers: Record<string, string> = { ...init?.headers } as Record<string, string>;
    if (paymentAuthHeader) {
      headers['x-payment'] = paymentAuthHeader;
    }

    delete headers['Authorization'];
    return fetch(input, {
      ...init,
      headers,
    });
  }
}

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
    
    console.log('[Chat API] Headers:', {
      useX402Header,
      useX402,
      hasPaymentHeader: !!paymentHeader,
    });

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
      const x402OpenAI = createOpenAI({
        baseURL: BASE_URL,
        apiKey: 'ignore',
        fetch: echoFetch(paymentHeader),
      });

      const result = streamText({
        model: x402OpenAI(model),
        messages: convertToModelMessages(messages),
      });

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
    console.error('Chat API error:', error);
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
