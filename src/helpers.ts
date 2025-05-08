import { accountManager } from './accounting/account';

export interface CompletionStateBody {
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export interface StreamingChunkBody {
    choices: {
        index: number;
        delta: {
            content?: string;
        };
        finish_reason: string | null;
    }[];
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    } | null;
}

export function parseSSE(data: string): StreamingChunkBody[] {
    // Split by double newlines to separate events
    const events = data.split('\n\n');
    const chunks: StreamingChunkBody[] = [];
    
    for (const event of events) {
        if (!event.trim()) continue;
        
        // Each event should start with 'data: '
        if (event.startsWith('data: ')) {
            const jsonStr = event.slice(6); // Remove 'data: ' prefix
            
            // Skip [DONE] marker
            if (jsonStr.trim() === '[DONE]') continue;
            
            try {
                const parsed = JSON.parse(jsonStr);
                chunks.push(parsed);
            } catch (error) {
                console.error('Error parsing SSE chunk:', error);
            }
        }
    }
    
    return chunks;
}

export function handleBody(user: string, data: string, stream: boolean): void {
    try {
        let prompt_tokens = 0;
        let completion_tokens = 0;
        let total_tokens = 0;

        if (stream) {
            const chunks = parseSSE(data);
            
            // Process each chunk
            for (const chunk of chunks) {
                // Only log usage if it exists
                if (chunk.usage) {
                    console.log('Streaming chunk usage:', {
                        prompt_tokens: chunk.usage.prompt_tokens,
                        completion_tokens: chunk.usage.completion_tokens,
                        total_tokens: chunk.usage.total_tokens
                    });
                    prompt_tokens += chunk.usage.prompt_tokens;
                    completion_tokens += chunk.usage.completion_tokens;
                    total_tokens += chunk.usage.total_tokens;
                }
            }
        } else {
            // Handle complete response
            const parsed = JSON.parse(data) as CompletionStateBody;
            if (parsed.usage) {
                console.log('Complete response usage:', {
                    prompt_tokens: parsed.usage.prompt_tokens,
                    completion_tokens: parsed.usage.completion_tokens,
                    total_tokens: parsed.usage.total_tokens
                });
                prompt_tokens += parsed.usage.prompt_tokens;
                completion_tokens += parsed.usage.completion_tokens;
                total_tokens += parsed.usage.total_tokens;
            }

        }
        accountManager.decrementAccount(user, total_tokens);
    } catch (error) {
        console.error('Error processing data:', error);
    }
} 