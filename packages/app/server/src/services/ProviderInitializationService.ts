import { Request, Response } from 'express';
import { extractModelName } from './RequestDataService';
import { isValidModel } from './AccountingService';
import { isValidImageModel } from './AccountingService';
import { isValidVideoModel } from './AccountingService';
import logger from '../logger';
import { UnknownModelError } from '../errors/http';
import { extractIsStream } from './RequestDataService';
import { getProvider } from '../providers/ProviderFactory';
import { EchoControlService } from './EchoControlService';
import { BaseProvider } from '../providers/BaseProvider';
import { PROXY_PASSTHROUGH_ONLY_MODEL } from '../providers/GeminiVeoProvider';

/**
 * Detects if the request is a proxy route, and should be forwarded rather
 * than initializing a provider. Returns true if this is a simple proxy route.
 * @param req
 *
 * @returns
 */
export function detectPassthroughProxyRoute(
  req: Request,
  echoControlService: EchoControlService
):
  | {
      provider: BaseProvider;
      model: string;
      isStream: boolean;
    }
  | undefined {
  // Gemini Veo3 Passthrough Proxy detection
  const passThroughPrefixes = ['/v1beta/files'];
  // https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-generate-001/operations/i7yyoxmbqsib
  const passThroughSuffixes = ['/operations/'];

  const matchesPrefix = passThroughPrefixes.find(prefix =>
    req.path.startsWith(prefix)
  );
  const matchesSuffix = passThroughSuffixes.find(suffix =>
    req.path.includes(suffix)
  );

  if (!matchesPrefix && !matchesSuffix) {
    return undefined;
  }

  // Extract requestId from either files or operations path
  const requestId =
    req.path.match(/\/files\/([^/:]+)(?::|$)/)?.[1] ??
    req.path.match(/\/operations\/([^\/]+)$/)?.[1] ??
    null;
  if (!requestId) {
    return undefined;
  }

  const model = PROXY_PASSTHROUGH_ONLY_MODEL;

  const isStream = extractIsStream(req);

  // Get the appropriate provider
  const provider = getProvider(model, echoControlService, isStream, req.path);

  return {
    provider,
    model,
    isStream,
  };
}

export async function initializeProvider(
  req: Request,
  res: Response,
  echoControlService: EchoControlService
): Promise<{
  provider: BaseProvider;
  model: string;
  isStream: boolean;
  isPassthroughProxyRoute: boolean;
}> {
  const passthroughProxyRoute = detectPassthroughProxyRoute(
    req,
    echoControlService
  );
  if (passthroughProxyRoute)
    return { ...passthroughProxyRoute, isPassthroughProxyRoute: true };

  const model = extractModelName(req);
  if (
    !model ||
    (!isValidModel(model) &&
      !isValidImageModel(model) &&
      !isValidVideoModel(model))
  ) {
    logger.error(`Invalid model: ${model}`);
    res.status(422).json({
      error: `Invalid model: ${model} Echo does not yet support this model.`,
    });
    throw new UnknownModelError('Invalid model');
  }

  // Extract stream flag
  const isStream = extractIsStream(req);

  // Get the appropriate provider
  const provider = getProvider(model, echoControlService, isStream, req.path);

  return {
    provider,
    model,
    isStream,
    isPassthroughProxyRoute: false,
  };
}
