#!/usr/bin/env node

import {
  OpenRouterModels,
  createEchoOpenRouter,
} from '@merit-systems/echo-typescript-sdk';
import { streamText } from 'ai';

const ECHO_TOKEN = process.env.ECHO_API_KEY;
const ECHO_APP_ID = process.env.ECHO_APP_ID;
const baseRouterUrl = process.env.ECHO_DATA_SERVER_URL || 'https://echo.router.merit.systems';

function assertEnv() {
  if (!ECHO_TOKEN) throw new Error('Missing Echo token ECHO_API_KEY');
  if (!ECHO_APP_ID) throw new Error('Missing Echo app id (ECHO_APP_ID)');
}

const getToken = async () => ECHO_TOKEN;

async function streamFromOpenRouter() {
  try {
    assertEnv();

    const openrouter = createEchoOpenRouter(
      { appId: ECHO_APP_ID, baseRouterUrl },
      getToken
    );

    const prompt = "Create a Vite calculator app with a clean, modern UI. Include basic arithmetic operations (addition, subtraction, multiplication, division) and make it responsive. Use vanilla JavaScript and CSS. Show the complete code with file structure.";

    console.log('🚀 Streaming from moonshotai/kimi-k2-0905...');
    console.log('📝 Prompt:', prompt);
    console.log('\n' + '='.repeat(80) + '\n');

    const { textStream } = streamText({
      model: openrouter('x-ai/grok-code-fast-1'),
      prompt: prompt,
    });

    let fullResponse = '';
    for await (const delta of textStream) {
      process.stdout.write(delta);
      fullResponse += delta;
    }

    console.log('\n\n' + '='.repeat(80));
    console.log('✅ Stream completed!');
    console.log(`📊 Total characters streamed: ${fullResponse.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

streamFromOpenRouter();