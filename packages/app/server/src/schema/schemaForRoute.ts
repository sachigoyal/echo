import { OpenAIVideoCreateParamsSchema, OpenAIVideoSchema } from "./video/openai";
import { GeminiFlashImageInputSchema, GeminiFlashImageOutputSchema } from "./image/gemini";
import { z } from "zod";
import { ChatCompletionInput, ChatCompletionOutput } from "./chat/completions";
import { CreateImagesRequest, CreateImagesResponse } from "./image/openai";

export function getSchemaForRoute(path: string): { input: { type: "http"; method: string; bodyFields?: unknown }; output: unknown } | undefined {
    if (path.endsWith("/videos")) {
        return {
            input: {
                type: "http",
                method: "POST",
                bodyFields: z.toJSONSchema(OpenAIVideoCreateParamsSchema),
            },
            output: z.toJSONSchema(OpenAIVideoSchema),
        };
    }
    if (path.endsWith("/images/generations")) {
        return {
            input: {
                type: "http",
                method: "POST",
                bodyFields: z.toJSONSchema(CreateImagesRequest),
            },
            output: z.toJSONSchema(CreateImagesResponse),
        };
    }
    if (path.endsWith(":generateContent")) {
        return {
            input: {
                type: "http",
                method: "POST",
                bodyFields: z.toJSONSchema(GeminiFlashImageInputSchema),
            },
            output: z.toJSONSchema(GeminiFlashImageOutputSchema),
        };
    }
    if (path.endsWith("/chat/completions")) {
        return {
            input: {
                type: "http",
                method: "POST",
                bodyFields: z.toJSONSchema(ChatCompletionInput),
            },
            output: z.toJSONSchema(ChatCompletionOutput),
        };
    }
    return undefined;
}