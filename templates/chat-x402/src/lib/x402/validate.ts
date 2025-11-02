import type { UIMessage } from 'ai';

interface ChatRequest {
  model: string;
  messages: UIMessage[];
}

export function validateChatRequest(body: unknown): {
  isValid: boolean;
  data?: ChatRequest;
  error?: { message: string; status: number };
} {
  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      error: { message: 'Invalid request body', status: 400 },
    };
  }

  const { model, messages } = body as Record<string, unknown>;

  if (!model || typeof model !== 'string') {
    return {
      isValid: false,
      error: { message: 'Model parameter is required', status: 400 },
    };
  }

  if (!messages || !Array.isArray(messages)) {
    return {
      isValid: false,
      error: { 
        message: 'Messages parameter is required and must be an array', 
        status: 400 
      },
    };
  }

  return {
    isValid: true,
    data: { model, messages },
  };
}

