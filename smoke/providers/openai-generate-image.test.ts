import {
  OpenAIImageModels,
  createEchoOpenAI,
} from '@merit-systems/echo-typescript-sdk';
import { experimental_generateImage as generateImage } from 'ai';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  ECHO_APP_ID,
  assertEnv,
  baseRouterUrl,
  getApiErrorDetails,
  getToken,
} from './test-helpers';

beforeAll(assertEnv);

describe.concurrent('OpenAI generateImage per model', () => {
  const openai = createEchoOpenAI(
    { appId: ECHO_APP_ID!, baseRouterUrl },
    getToken
  );

  for (const { model_id } of OpenAIImageModels) {
    it(`OpenAI image ${model_id}`, async () => {
      try {
        const { image } = await generateImage({
          model: await openai.image(model_id),
          prompt: 'An incredibly fat cat',
          size: '1024x1024',
          providerOptions: { openai: { quality: 'low' } },
        });
        expect(image).toBeDefined();
      } catch (err) {
        const details = getApiErrorDetails(err);
        throw new Error(
          `[generateImage] OpenAI ${model_id} failed: ${details}`
        );
      }
    });
  }
});
