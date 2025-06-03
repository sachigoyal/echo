# Endpoint Tests

This directory contains comprehensive tests for the Echo server's streaming and non-streaming endpoints.

## Test Files

### `endpoints.test.ts`

A comprehensive test suite that covers all major functionality of the Echo server:

#### **Provider-Specific Tests**
Tests for all supported providers and models:
- **GPT Provider**: `gpt-3.5-turbo`, `gpt-4o` (OpenAI format)
- **AnthropicGPT Provider**: `claude-3-5-sonnet-20240620` (OpenAI format via Anthropic)
- **AnthropicNative Provider**: `claude-3-5-sonnet-20240620` (Anthropic native format)

Each provider is tested for:
- **Non-streaming endpoints**: Regular chat completions
- **Streaming endpoints**: Server-sent events streaming
- **Token accounting**: Proper deduction from user accounts
- **Content-type headers**: Correct response headers
- **Request body processing**: Adding `stream_options` when needed

#### **Authentication Tests**
- Bearer token authentication (OpenAI format)
- x-api-key header authentication (Anthropic native)
- Invalid/missing authentication handling

#### **Error Handling Tests**
- Upstream API errors (400, 429, etc.)
- Unknown model errors
- Payment required errors (insufficient balance)

#### **Account Management Tests**
- Insufficient balance rejection (402 Payment Required)
- Successful requests with sufficient balance
- Token deduction verification

#### **Request Processing Tests**
- Stream options injection for streaming requests
- Proper request forwarding to upstream APIs

## Mock Strategy

The tests use comprehensive mocking:

1. **Environment Variables**: Mock API keys for OpenAI and Anthropic
2. **Fetch Requests**: Mock all upstream API calls with realistic responses
3. **Streaming Responses**: Mock ReadableStream objects that simulate real API streaming
4. **Account Manager**: Reset and configure test accounts before each test

## Mock Response Formats

### OpenAI Format (GPT, AnthropicGPT)
```javascript
// Non-streaming
{
  choices: [{ message: { content: "response" } }],
  usage: { total_tokens: 10 }
}

// Streaming  
data: {"choices":[{"delta":{"content":"word"}}]}
data: {"usage":{"total_tokens":10}}
data: [DONE]
```

### Anthropic Native Format
```javascript
// Non-streaming (not implemented in provider)
{
  content: [{ text: "response" }],
  usage: { output_tokens: 7 }
}

// Streaming
data: {"type":"content_block_delta","delta":{"text":"word"}}
data: {"type":"message_delta","usage":{"output_tokens":7}}
```

## Running the Tests

```bash
# Run all endpoint tests
npm test src/__tests__/endpoints.test.ts

# Run with verbose output
npm test -- --verbose src/__tests__/endpoints.test.ts

# Run specific test group
npm test -- --testNamePattern="GPT Provider" src/__tests__/endpoints.test.ts
```

## Test Coverage

The tests cover:
- ✅ All 4 provider configurations
- ✅ Both streaming and non-streaming modes  
- ✅ Both authentication methods
- ✅ Error conditions and edge cases
- ✅ Account balance management
- ✅ Token counting and billing
- ✅ Request/response format validation
- ✅ Stream processing and duplication

## Key Features Tested

1. **Multi-Provider Support**: Tests ensure all providers work correctly
2. **Streaming Architecture**: Validates stream duplication for billing
3. **Authentication**: Multiple auth methods work properly
4. **Error Resilience**: Proper error handling and status codes
5. **Billing Accuracy**: Token counting works for all providers
6. **Request Processing**: Body modifications and header handling

This test suite provides confidence that the Echo server correctly proxies requests to various AI providers while maintaining accurate billing and proper error handling. 