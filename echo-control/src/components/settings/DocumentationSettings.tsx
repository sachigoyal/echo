'use client';

import React from 'react';

export default function DocumentationSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Documentation</h3>
        <p className="text-sm text-muted-foreground">
          Learn how to integrate and use the Echo SDK with multiple AI models
        </p>
      </div>

      {/* SDK Documentation Section */}
      <div className="">
        <div className="space-y-4">
          <div className="bg-muted/30 rounded-lg p-4">
            <h5 className="text-sm font-semibold text-foreground mb-3">
              Using useEchoOpenAI Hook with Multiple Models
            </h5>
            <div className="space-y-3 text-sm text-foreground">
              <p>
                The{' '}
                <code className="bg-muted px-2 py-1 rounded text-xs">
                  useEchoOpenAI
                </code>{' '}
                hook provides a seamless way to access multiple AI models
                through the Echo platform using the OpenAI SDK interface.
              </p>

              <div>
                <h6 className="font-medium mb-2">Basic Usage:</h6>
                <pre className="bg-card border rounded p-3 text-xs overflow-x-auto">
                  {`import { useEchoOpenAI } from '@echo/react-sdk';

function MyComponent() {
  const { openai, isReady } = useEchoOpenAI();

  if (!isReady) return <div>Loading...</div>;

  const handleChat = async () => {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hello!' }],
    });
  };
}`}
                </pre>
              </div>

              <div>
                <h6 className="font-medium mb-2">Supported Models:</h6>
                <p className="mb-2">
                  You can use any model from our supported list by passing it to
                  the <code className="bg-muted px-1 rounded">model</code>{' '}
                  parameter:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <strong>OpenAI Models:</strong>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      <li>gpt-4.1, gpt-4.1-mini, gpt-4.1-nano</li>
                      <li>gpt-4o, gpt-4o-mini</li>
                      <li>o1, o1-mini, o3, o3-mini</li>
                      <li>gpt-4-turbo</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Anthropic Models:</strong>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      <li>claude-4-opus, claude-4-sonnet</li>
                      <li>claude-3-5-sonnet</li>
                      <li>claude-3-7-sonnet</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-2">
                  <strong>Google Models:</strong>
                  <ul className="list-disc list-inside ml-2 space-y-1 text-xs">
                    <li>gemini-2.5-flash, gemini-2.5-pro</li>
                    <li>gemini-2.0-flash</li>
                  </ul>
                </div>
              </div>

              <div>
                <h6 className="font-medium mb-2">Model-Specific Examples:</h6>
                <pre className="bg-card border rounded p-3 text-xs overflow-x-auto">
                  {`// Use Claude
const claudeResponse = await openai.chat.completions.create({
  model: 'claude-4-sonnet',
  messages: [{ role: 'user', content: 'Analyze this data...' }],
});

// Use GPT-4o
const visionResponse = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: 'How far away is the sun?' },
    ]
  }],
});

// Use Gemini
const geminiResponse = await openai.chat.completions.create({
  model: 'gemini-2.5-pro',
  messages: [{ role: 'user', content: 'Process this large document...' }],
});`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
