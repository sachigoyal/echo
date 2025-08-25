import { SupportedModel } from "./types";

// Union type of all valid Gemini model IDs
export type GeminiModel = 
  | "gemini-2.0-flash"
  | "gemini-2.0-flash-lite"
  | "gemini-2.5-flash"
  | "gemini-2.5-flash-lite"
  | "gemini-2.5-pro"
  | "gemma-2-9b";

export const GeminiModels: SupportedModel[] = [
  {
    model_id: "gemini-2.0-flash",
    input_cost_per_token: 1.5e-7,
    output_cost_per_token: 6e-7,
    provider: "Gemini"
  },
  {
    model_id: "gemini-2.0-flash-lite",
    input_cost_per_token: 7.5e-8,
    output_cost_per_token: 3e-7,
    provider: "Gemini"
  },
  {
    model_id: "gemini-2.5-flash",
    input_cost_per_token: 3e-7,
    output_cost_per_token: 0.0000025,
    provider: "Gemini"
  },
  {
    model_id: "gemini-2.5-flash-lite",
    input_cost_per_token: 1e-7,
    output_cost_per_token: 4e-7,
    provider: "Gemini"
  },
  {
    model_id: "gemini-2.5-pro",
    input_cost_per_token: 0.0000025,
    output_cost_per_token: 0.00001,
    provider: "Gemini"
  },
  {
    model_id: "gemma-2-9b",
    input_cost_per_token: 2e-7,
    output_cost_per_token: 2e-7,
    provider: "Gemini"
  }
];

