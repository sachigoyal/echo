'use client';

import NextImage from 'next/image';
import { useState } from 'react';

export default function ImageGenerator() {
  const [imageUrl, setImageUrl] = useState<{
    base64Data: string;
    mediaType: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');

  const generateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const { imageUrl } = await response.json();
      setImageUrl(imageUrl);
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <form onSubmit={generateImage} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Image Prompt
          </label>
          <input
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            disabled={loading}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="w-full rounded-md bg-gray-900 px-4 py-2.5 font-mono text-white shadow-sm transition-all duration-150 hover:bg-gray-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex items-center justify-center gap-2">
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating...
              </>
            ) : (
              'Generate Image'
            )}
          </span>
        </button>
      </form>

      {/* Generated Image */}
      {imageUrl && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            Generated Image:
          </h3>
          <div className="relative h-96 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <NextImage
              src={`data:${imageUrl.mediaType};base64,${imageUrl.base64Data}`}
              alt={prompt || 'Generated image'}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
          <p className="text-sm italic text-gray-500">&quot;{prompt}&quot;</p>
        </div>
      )}
    </div>
  );
}
