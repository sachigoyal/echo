#!/usr/bin/env npx tsx

// @ts-nocheck
import { writeFileSync } from 'fs';
import { join } from 'path';

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type?: string;
  };
  top_provider: {
    max_completion_tokens?: number;
    is_moderated: boolean;
  };
  per_request_limits?: {
    prompt_tokens: string;
    completion_tokens: string;
  };
}

interface OpenRouterResponse {
  data: OpenRouterModel[];
}

async function fetchOpenRouterModels(): Promise<void> {
  try {
    console.log('Fetching OpenRouter models...');

    const response = await fetch('https://openrouter.ai/api/v1/models');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: OpenRouterResponse = await response.json();

    console.log(`Fetched ${data.data.length} models from OpenRouter`);

    // Create the output path
    const outputPath = join(__dirname, '..', 'open_router_model_prices.json');

    // Write the data to JSON file with pretty formatting
    writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`✅ Successfully saved OpenRouter models to: ${outputPath}`);
    console.log(`📊 Total models: ${data.data.length}`);

    // Log some sample models for verification
    const sampleModels = data.data.slice(0, 3).map(model => ({
      id: model.id,
      name: model.name,
      prompt_price: model.pricing.prompt,
      completion_price: model.pricing.completion,
    }));

    console.log('Sample models:');
    console.table(sampleModels);
  } catch (error) {
    console.error('❌ Error fetching OpenRouter models:', error);
    process.exit(1);
  }
}

// Run the script
fetchOpenRouterModels();
