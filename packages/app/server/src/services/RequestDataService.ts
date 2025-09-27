import { Request } from 'express';
import { BaseProvider } from '../providers/BaseProvider';
import { ProviderType } from '../providers/ProviderType';
import {
  isGeminiStreamingPath,
  extractGeminiModelName,
} from '../utils/gemini/string-parsing.js';

export function extractModelName(req: Request): string | undefined {
  const model = req.body.model;

  if (model && model !== undefined) {
    return model;
  }

  const modelFromPath = extractGeminiModelName(req);

  if (modelFromPath && modelFromPath !== undefined) {
    return modelFromPath;
  }

  return undefined;
}

export function extractIsStream(req: Request): boolean {
  const stream = req.body.stream;

  if (stream && stream !== undefined) {
    return stream;
  }

  if (isGeminiStreamingPath(req.path)) {
    return true;
  }

  return false;
}

export function formatUpstreamUrl(
  provider: BaseProvider,
  req: Request
): string {
  // Special handling for Vertex AI to avoid URL duplication
  if (provider.getType() === ProviderType.VERTEX_AI) {
    // For Vertex AI, we need to construct the URL differently to avoid /v1 duplication
    const pathWithoutV1 = req.path.replace(/^\/v1/, ''); // Remove /v1 from start
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'global';

    const upstreamUrl = `https://aiplatform.googleapis.com/v1/projects/${project}/locations/${location}${pathWithoutV1}${
      req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''
    }`;
    return upstreamUrl;
  }

  // For all other providers, use the original logic
  const upstreamUrl = `${provider.getBaseUrl(req.path)}${req.path}${
    req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''
  }`;
  return upstreamUrl;
}
