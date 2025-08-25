#!/usr/bin/env node

// -> Get all model slugs from Anthropic's API directly
// Match them to the AI gateway model slugs for accurate pricing
// Write to a static file in the src/supported-models/anthropic.ts file

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

interface AnthropicApiModel {
  type: string;
  id: string;
  display_name: string;
  created_at: string;
}

interface AnthropicApiResponse {
  data: AnthropicApiModel[];
  has_more: boolean;
  first_id: string;
  last_id: string;
}

async function fetchAnthropicModels(): Promise<string[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch Anthropic models: ${response.status} ${response.statusText}`
      );
    }

    const data: AnthropicApiResponse = await response.json();
    console.log(`🔍 Found ${data.data.length} models from Anthropic API`);

    // Extract model IDs and log them
    const modelIds = data.data.map(model => model.id);
    modelIds.forEach(id => console.log(`  - ${id}`));

    return modelIds;
  } catch (error) {
    console.error('❌ Error fetching models from Anthropic API:', error);
    throw error;
  }
}

function matchAnthropicModelsWithPricing(
  anthropicModelIds: string[],
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
    `\n🔄 Matching ${anthropicModelIds.length} Anthropic models with gateway pricing...`
  );

  // For each Anthropic model ID, try to find matching pricing
  for (const modelId of anthropicModelIds) {
    let pricing = pricingMap.get(modelId);

    // Check if we found an exact match first
    if (pricing) {
      console.log(`✅ Exact match found for ${modelId}`);
    } else {
      // Extract base model name for matching
      // claude-3-5-sonnet-latest -> claude-3-5-sonnet
      // claude-opus-4-20250514 -> claude-opus-4
      let baseModelName = modelId;

      // Remove specific version suffixes
      baseModelName = baseModelName.replace(/-latest$/, '');
      baseModelName = baseModelName.replace(/-\d{8}$/, ''); // Remove date suffixes like -20250514
      baseModelName = baseModelName.replace(/-\d{4}-\d{2}-\d{2}$/, ''); // Remove date suffixes like -2024-10-22

      // Look for gateway models that match this base name
      // Handle differences in naming conventions (dots vs dashes)
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
        provider: 'Anthropic',
      });
    } else {
      // Extract base model name for logging
      let debugBaseModelName = modelId;
      debugBaseModelName = debugBaseModelName.replace(/-latest$/, '');
      debugBaseModelName = debugBaseModelName.replace(/-\d{8}$/, '');
      debugBaseModelName = debugBaseModelName.replace(
        /-\d{4}-\d{2}-\d{2}$/,
        ''
      );
      console.warn(
        `⚠️  No pricing found for Anthropic model: ${modelId} (base: ${debugBaseModelName}) - dropping from list`
      );
    }
  }

  return result;
}

function cleanModelId(modelId: string): string {
  return modelId.split('/')[1];
}

function generateAnthropicModelFile(models: SupportedModel[]): string {
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
    provider: "Anthropic"
  }`;
    })
    .join(',\n');

  return `import { SupportedModel } from "./types";

// Union type of all valid Anthropic model IDs
export type AnthropicModel = 
${unionType};

export const AnthropicModels: SupportedModel[] = [
${modelObjects}
];

`;
}

async function updateAnthropicModels() {
  try {
    console.log('🔄 Starting Anthropic model update process...\n');

    // Step 1: Fetch available models from Anthropic API
    console.log('📡 Fetching available models from Anthropic API...');
    const anthropicModelIds = await fetchAnthropicModels();

    // Step 2: Fetch pricing data from AI Gateway
    console.log('\n💰 Fetching pricing data from AI SDK Gateway...');
    const availableModels = await gateway.getAvailableModels();

    // Filter for Anthropic models from the gateway
    const anthropicGatewayModels = availableModels.models
      .filter(model => model.id.startsWith('anthropic/'))
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
          provider: 'Anthropic',
        };
      });

    if (anthropicGatewayModels.length === 0) {
      console.log('No Anthropic models found in gateway response');
      return;
    }

    console.log(
      `Found ${anthropicGatewayModels.length} Anthropic models in gateway`
    );

    // Step 3: Match Anthropic API models with gateway pricing
    const finalModels = matchAnthropicModelsWithPricing(
      anthropicModelIds,
      anthropicGatewayModels
    );

    // Generate the new file content
    const fileContent = generateAnthropicModelFile(finalModels);

    // Write the updated file
    const fullPath = join(process.cwd(), 'src/supported-models/anthropic.ts');
    writeFileSync(fullPath, fileContent, 'utf8');

    console.log(
      `\n✅ Successfully updated anthropic.ts with ${finalModels.length} models`
    );
    console.log(`📊 Models included:`);
    finalModels.forEach(model => {
      console.log(`  - ${model.model_id}`);
    });

    const droppedCount = anthropicModelIds.length - finalModels.length;
    if (droppedCount > 0) {
      console.log(
        `\n⚠️  ${droppedCount} models were dropped due to missing pricing data`
      );
    }
  } catch (error) {
    console.error('❌ Error updating Anthropic models:', error);
    process.exit(1);
  }
}

// Run the script
updateAnthropicModels().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
