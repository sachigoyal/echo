#!/usr/bin/env node

// -> Get all model slugs from OpenAI's API directly
// Match them to the AI gateway model slugs for accurate pricing
// Write to a static file in the src/supported-models/openai.ts file

import { config } from 'dotenv';
import { gateway } from '@ai-sdk/gateway';
import { writeFileSync } from 'fs';
import { join } from 'path';
// Load environment variables
config();

interface SupportedModel {
  model_id: string;
  input_cost_per_token: number;
  output_cost_per_token: number;
  provider: string;
}

interface OpenAIApiModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

interface OpenAIApiResponse {
  object: string;
  data: OpenAIApiModel[];
}

async function fetchOpenAIModels(): Promise<string[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch OpenAI models: ${response.status} ${response.statusText}`
      );
    }

    const data: OpenAIApiResponse = await response.json();
    console.log(`🔍 Found ${data.data.length} models from OpenAI API`);

    // Filter for language models and extract model IDs
    const modelIds = data.data
      .filter(model => {
        // Filter out non-language models (embeddings, audio, etc.)
        const isLanguageModel =
          model.id.includes('gpt') ||
          model.id.includes('o1') ||
          model.id.includes('o3') ||
          model.id.includes('davinci') ||
          model.id.includes('curie') ||
          model.id.includes('babbage') ||
          model.id.includes('ada');

        // Exclude specific non-language model types
        const isNotEmbedding = !model.id.includes('embedding');
        const isNotAudio =
          !model.id.includes('whisper') && !model.id.includes('tts');
        const isNotVision = !model.id.includes('dall-e');

        return isLanguageModel && isNotEmbedding && isNotAudio && isNotVision;
      })
      .map(model => model.id);

    console.log(`📝 Filtered to ${modelIds.length} language models:`);
    modelIds.forEach(id => console.log(`  - ${id}`));

    return modelIds;
  } catch (error) {
    console.error('❌ Error fetching models from OpenAI API:', error);
    throw error;
  }
}

function matchOpenAIModelsWithPricing(
  openaiModelIds: string[],
  gatewayModels: SupportedModel[]
): SupportedModel[] {
  const result: SupportedModel[] = [];

  // Create a map of base model names to their pricing info from gateway
  const pricingMap = new Map<string, { input: number; output: number }>();
  gatewayModels.forEach(model => {
    pricingMap.set(model.model_id, {
      input: model.input_cost_per_token,
      output: model.output_cost_per_token,
    });
  });

  console.log(
    `\n🔄 Matching ${openaiModelIds.length} OpenAI models with gateway pricing...`
  );

  // For each OpenAI model ID, try to find matching pricing
  for (const modelId of openaiModelIds) {
    let pricing = pricingMap.get(modelId);

    // Check if we found an exact match first
    if (pricing) {
      console.log(`✅ Exact match found for ${modelId}`);
    } else {
      // Extract base model name for matching
      // gpt-4-turbo-2024-04-09 -> gpt-4-turbo
      // gpt-3.5-turbo-16k-0613 -> gpt-3.5-turbo
      let baseModelName = modelId;

      // Remove specific version suffixes
      baseModelName = baseModelName.replace(/-\d{4}-\d{2}-\d{2}$/, ''); // Remove date suffixes like -2024-04-09
      baseModelName = baseModelName.replace(/-\d{4}$/, ''); // Remove year suffixes like -2024
      baseModelName = baseModelName.replace(/-16k.*$/, ''); // Remove 16k variants
      baseModelName = baseModelName.replace(/-32k.*$/, ''); // Remove 32k variants
      baseModelName = baseModelName.replace(/-\d{4}.*$/, ''); // Remove timestamped versions
      baseModelName = baseModelName.replace(/-preview.*$/, ''); // Remove preview suffixes
      baseModelName = baseModelName.replace(/-latest$/, ''); // Remove latest suffixes

      // Look for gateway models that match this base name
      const potentialMatches: {
        gatewayModelId: string;
        pricing: { input: number; output: number };
      }[] = [];

      for (const [gatewayModelId, gatewayPricing] of pricingMap.entries()) {
        // Normalize both model names for comparison
        const normalizedGatewayId = gatewayModelId.replace(/\./g, '-');
        const normalizedBaseModel = baseModelName.replace(/\./g, '-');

        if (
          normalizedGatewayId.startsWith(normalizedBaseModel) ||
          normalizedBaseModel.startsWith(normalizedGatewayId) ||
          gatewayModelId.startsWith(baseModelName) ||
          baseModelName.startsWith(gatewayModelId)
        ) {
          potentialMatches.push({ gatewayModelId, pricing: gatewayPricing });
        }
      }

      // If we found matches, select the most specific one
      if (potentialMatches.length > 0) {
        // Sort by specificity: exact match > longest match > first match
        potentialMatches.sort((a, b) => {
          const aNormalized = a.gatewayModelId.replace(/\./g, '-');
          const bNormalized = b.gatewayModelId.replace(/\./g, '-');
          const baseNormalized = baseModelName.replace(/\./g, '-');

          // Check for exact matches first
          if (aNormalized === baseNormalized && bNormalized !== baseNormalized)
            return -1;
          if (bNormalized === baseNormalized && aNormalized !== baseNormalized)
            return 1;

          // Otherwise, prefer longer (more specific) matches
          return b.gatewayModelId.length - a.gatewayModelId.length;
        });

        const bestMatch = potentialMatches[0];
        pricing = bestMatch.pricing;
        console.log(
          `✅ Matched ${modelId} with ${bestMatch.gatewayModelId} pricing`
        );
      }
    }

    // If we found pricing info, add the model
    if (pricing) {
      result.push({
        model_id: modelId,
        input_cost_per_token: pricing.input,
        output_cost_per_token: pricing.output,
        provider: 'OpenAI',
      });
    } else {
      // Extract base model name for logging
      let debugBaseModelName = modelId;
      debugBaseModelName = debugBaseModelName.replace(
        /-\d{4}-\d{2}-\d{2}$/,
        ''
      );
      debugBaseModelName = debugBaseModelName.replace(/-\d{4}$/, '');
      debugBaseModelName = debugBaseModelName.replace(/-16k.*$/, '');
      debugBaseModelName = debugBaseModelName.replace(/-32k.*$/, '');
      debugBaseModelName = debugBaseModelName.replace(/-\d{4}.*$/, '');
      debugBaseModelName = debugBaseModelName.replace(/-preview.*$/, '');
      debugBaseModelName = debugBaseModelName.replace(/-latest$/, '');
      console.warn(
        `⚠️  No pricing found for OpenAI model: ${modelId} (base: ${debugBaseModelName}) - dropping from list`
      );
    }
  }

  return result;
}

function cleanModelId(modelId: string): string {
  return modelId.split('/')[1];
}

function generateOpenAIModelFile(models: SupportedModel[]): string {
  const sortedModels = models.sort((a, b) =>
    a.model_id.localeCompare(b.model_id)
  );

  // Generate union type
  const unionType = sortedModels
    .map(model => `  | "${model.model_id}"`)
    .join('\n');

  // Generate model objects
  const modelObjects = sortedModels
    .map(model => {
      return `  {
    model_id: "${model.model_id}",
    input_cost_per_token: ${model.input_cost_per_token},
    output_cost_per_token: ${model.output_cost_per_token},
    provider: "OpenAI"
  }`;
    })
    .join(',\n');

  return `import { SupportedModel } from "./types";

// Union type of all valid OpenAI model IDs
export type OpenAIModel = 
${unionType};

export const OpenAIModels: SupportedModel[] = [
${modelObjects}
];

`;
}

async function updateOpenAIModels() {
  try {
    console.log('🔄 Starting OpenAI model update process...\n');

    // Step 1: Fetch available models from OpenAI API
    console.log('📡 Fetching available models from OpenAI API...');
    const openaiModelIds = await fetchOpenAIModels();

    // Step 2: Fetch pricing data from AI Gateway
    console.log('\n💰 Fetching pricing data from AI SDK Gateway...');
    const availableModels = await gateway.getAvailableModels();

    // Filter for OpenAI models from the gateway
    const openaiGatewayModels = availableModels.models
      .filter(model => model.id.startsWith('openai/'))
      .filter(model => model.modelType === 'language')
      .map(model => {
        const cleanId = cleanModelId(model.id);

        console.log(`Found gateway model: ${model.id} -> ${cleanId}`);

        // Validate that required fields exist in gateway response
        if (!model.pricing) {
          throw new Error(`Model ${model.id} is missing pricing information`);
        }

        if (model.pricing.input === undefined || model.pricing.input === null) {
          throw new Error(`Model ${model.id} is missing input pricing`);
        }

        if (
          model.pricing.output === undefined ||
          model.pricing.output === null
        ) {
          throw new Error(`Model ${model.id} is missing output pricing`);
        }

        const inputCost = Number(model.pricing.input);
        const outputCost = Number(model.pricing.output);

        return {
          model_id: cleanId,
          input_cost_per_token: inputCost,
          output_cost_per_token: outputCost,
          provider: 'OpenAI',
        };
      });

    if (openaiGatewayModels.length === 0) {
      console.log('No OpenAI models found in gateway response');
      return;
    }

    console.log(`Found ${openaiGatewayModels.length} OpenAI models in gateway`);

    // Step 3: Match OpenAI API models with gateway pricing
    const finalModels = matchOpenAIModelsWithPricing(
      openaiModelIds,
      openaiGatewayModels
    );

    // Generate the new file content
    const fileContent = generateOpenAIModelFile(finalModels);

    // Write the updated file
    const fullPath = join(process.cwd(), 'src/supported-models/chat/openai.ts');
    writeFileSync(fullPath, fileContent, 'utf8');

    console.log(
      `\n✅ Successfully updated openai.ts with ${finalModels.length} models`
    );
    console.log(`📊 Models included:`);
    finalModels.forEach(model => {
      console.log(`  - ${model.model_id}`);
    });

    const droppedCount = openaiModelIds.length - finalModels.length;
    if (droppedCount > 0) {
      console.log(
        `\n⚠️  ${droppedCount} models were dropped due to missing pricing data`
      );
    }
  } catch (error) {
    console.error('❌ Error updating OpenAI models:', error);
    process.exit(1);
  }
}

// Run the script
updateOpenAIModels().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
