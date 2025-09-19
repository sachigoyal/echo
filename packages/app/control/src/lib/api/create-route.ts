import { RouteHandlerBuilder } from './handler-builder';
import { HandlerServerErrorFn, ServerErrorBody } from './types';

export function createZodRoute<TServerErrorBody = ServerErrorBody>(params?: {
  handleServerError?: HandlerServerErrorFn<TServerErrorBody>;
}) {
  return new RouteHandlerBuilder({
    handleServerError: params?.handleServerError,
    contextType: {},
  });
}
