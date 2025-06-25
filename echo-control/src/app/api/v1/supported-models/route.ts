import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const modelPricesPath = path.join(process.cwd(), 'model_prices.json');
const modelPricesData = await fs.readFile(modelPricesPath, 'utf8');
const modelPrices = JSON.parse(modelPricesData);

export async function GET() {
  try {
    // Transform the data to return important information for users
    const supportedModels = Object.entries(modelPrices).map(
      ([modelName, modelData]: [string, any]) => ({
        name: modelName,
        provider: modelData.litellm_provider,
        pricing: {
          input_cost_per_token: modelData.input_cost_per_token,
          output_cost_per_token: modelData.output_cost_per_token,
        },
        limits: {
          max_tokens: modelData.max_tokens,
          max_input_tokens: modelData.max_input_tokens,
          max_output_tokens: modelData.max_output_tokens,
        },
        capabilities: {
          mode: modelData.mode,
          supports_function_calling:
            modelData.supports_function_calling || false,
          // supports_parallel_function_calling: modelData.supports_parallel_function_calling || false,
          // supports_vision: modelData.supports_vision || false,
          // supports_pdf_input: modelData.supports_pdf_input || false,
          // supports_web_search: modelData.supports_web_search || false,
          // supports_computer_use: modelData.supports_computer_use || false,
          // supports_reasoning: modelData.supports_reasoning || false,
          // supports_prompt_caching: modelData.supports_prompt_caching || false,
          // supports_response_schema: modelData.supports_response_schema || false,
          // supports_tool_choice: modelData.supports_tool_choice || false,
          // supports_assistant_prefill: modelData.supports_assistant_prefill || false,
          supports_system_messages: modelData.supports_system_messages || false,
          supports_native_streaming:
            modelData.supports_native_streaming || false,
        },
        metadata: {
          deprecation_date: modelData.deprecation_date,
          supported_endpoints: modelData.supported_endpoints,
          // supported_modalities: modelData.supported_modalities,
          // supported_output_modalities: modelData.supported_output_modalities,
          tool_use_system_prompt_tokens:
            modelData.tool_use_system_prompt_tokens,
          // search_context_cost_per_query: modelData.search_context_cost_per_query,
        },
      })
    );

    // Group by provider for easier consumption
    const groupedByProvider = supportedModels.reduce(
      (acc, model) => {
        if (!acc[model.provider]) {
          acc[model.provider] = [];
        }
        acc[model.provider].push(model);
        return acc;
      },
      {} as Record<string, typeof supportedModels>
    );

    return NextResponse.json({
      models: supportedModels,
      models_by_provider: groupedByProvider,
    });
  } catch (error) {
    console.error('Error reading model prices:', error);
    return NextResponse.json(
      { error: 'Failed to load supported models' },
      { status: 500 }
    );
  }
}
