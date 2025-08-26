#!/usr/bin/env node

// -> Get all model slugs from Gemini's API directly
// Match them to the AI gateway model slugs for accurate pricing
// Write to a static file in the src/supported-models/gemini.ts file

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

interface GeminiApiModel {
  name: string;
  version: string;
  displayName: string;
  description: string;
  inputTokenLimit: number;
  outputTokenLimit: number;
  supportedGenerationMethods: string[];
}

interface GeminiApiResponse {
  models: GeminiApiModel[];
}

async function fetchGeminiModels(): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch Gemini models: ${response.status} ${response.statusText}`
      );
    }

    const data: GeminiApiResponse = await response.json();
    console.log(`🔍 Found ${data.models.length} models from Gemini API`);

    // Filter for language models and extract model IDs
    const modelIds = data.models
      .filter(model => {
        // Filter for generation models (language models)
        const hasGenerateContent =
          model.supportedGenerationMethods?.includes('generateContent');

        // Filter out embedding models
        const isNotEmbedding =
          !model.name.includes('embedding') &&
          !model.displayName.toLowerCase().includes('embedding');

        // Filter out vision-only models (keep multimodal ones that can do text)
        const isNotVisionOnly = !model.displayName
          .toLowerCase()
          .includes('vision');

        return hasGenerateContent && isNotEmbedding && isNotVisionOnly;
      })
      .map(model => {
        // Extract model ID from the full name (e.g., "models/gemini-pro" -> "gemini-pro")
        const modelId = model.name.replace('models/', '');
        return modelId;
      });

    console.log(`📝 Filtered to ${modelIds.length} language models:`);
    modelIds.forEach(id => console.log(`  - ${id}`));

    return modelIds;
  } catch (error) {
    console.error('❌ Error fetching models from Gemini API:', error);
    throw error;
  }
}

function matchGeminiModelsWithPricing(
  geminiModelIds: string[],
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
    `\n🔄 Matching ${geminiModelIds.length} Gemini models with gateway pricing...`
  );

  // For each Gemini model ID, try to find matching pricing
  for (const modelId of geminiModelIds) {
    let pricing = pricingMap.get(modelId);

    // Check if we found an exact match first
    if (pricing) {
      console.log(`✅ Exact match found for ${modelId}`);
    } else {
      // Extract base model name for matching
      // gemini-1.5-pro-001 -> gemini-1.5-pro
      // gemini-pro-vision -> gemini-pro
      let baseModelName = modelId;

      // Remove specific version suffixes for Gemini models
      baseModelName = baseModelName.replace(/-\d{3}$/, ''); // Remove version suffixes like -001
      baseModelName = baseModelName.replace(/-latest$/, ''); // Remove latest suffixes
      baseModelName = baseModelName.replace(/-preview$/, ''); // Remove preview suffixes
      baseModelName = baseModelName.replace(/-vision$/, ''); // Remove vision suffixes
      baseModelName = baseModelName.replace(/-experimental.*$/, ''); // Remove experimental suffixes

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
        provider: 'Gemini',
      });
    } else {
      // Extract base model name for logging
      let debugBaseModelName = modelId;
      debugBaseModelName = debugBaseModelName.replace(/-\d{3}$/, '');
      debugBaseModelName = debugBaseModelName.replace(/-latest$/, '');
      debugBaseModelName = debugBaseModelName.replace(/-preview$/, '');
      debugBaseModelName = debugBaseModelName.replace(/-vision$/, '');
      debugBaseModelName = debugBaseModelName.replace(/-experimental.*$/, '');
      console.warn(
        `⚠️  No pricing found for Gemini model: ${modelId} (base: ${debugBaseModelName}) - dropping from list`
      );
    }
  }

  return result;
}

function cleanModelId(modelId: string): string {
  return modelId.split('/')[1];
}

function generateGeminiModelFile(models: SupportedModel[]): string {
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
    provider: "Gemini"
  }`;
    })
    .join(',\n');

  return `import { SupportedModel } from "./types";

// Union type of all valid Gemini model IDs
export type GeminiModel = 
${unionType};

export const GeminiModels: SupportedModel[] = [
${modelObjects}
];

`;
}

async function updateGeminiModels() {
  try {
    console.log('🔄 Starting Gemini model update process...\n');

    // Step 1: Fetch available models from Gemini API
    console.log('📡 Fetching available models from Gemini API...');
    const geminiModelIds = await fetchGeminiModels();

    // Step 2: Fetch pricing data from AI Gateway
    console.log('\n💰 Fetching pricing data from AI SDK Gateway...');
    const availableModels = await gateway.getAvailableModels();

    // Filter for Gemini models from the gateway
    const geminiGatewayModels = availableModels.models
      .filter(model => model.id.startsWith('google/'))
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
          provider: 'Gemini',
        };
      });

    if (geminiGatewayModels.length === 0) {
      console.log('No Gemini models found in gateway response');
      return;
    }

    console.log(`Found ${geminiGatewayModels.length} Gemini models in gateway`);

    // Step 3: Match Gemini API models with gateway pricing
    const finalModels = matchGeminiModelsWithPricing(
      geminiModelIds,
      geminiGatewayModels
    );

    // Generate the new file content
    const fileContent = generateGeminiModelFile(finalModels);

    // Write the updated file
    const fullPath = join(process.cwd(), 'src/supported-models/chat/gemini.ts');
    writeFileSync(fullPath, fileContent, 'utf8');

    console.log(
      `\n✅ Successfully updated gemini.ts with ${finalModels.length} models`
    );
    console.log(`📊 Models included:`);
    finalModels.forEach(model => {
      console.log(`  - ${model.model_id}`);
    });

    const droppedCount = geminiModelIds.length - finalModels.length;
    if (droppedCount > 0) {
      console.log(
        `\n⚠️  ${droppedCount} models were dropped due to missing pricing data`
      );
    }
  } catch (error) {
    console.error('❌ Error updating Gemini models:', error);
    process.exit(1);
  }
}

// Run the script
updateGeminiModels().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
