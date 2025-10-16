import { SupportedModel } from '../types';

export type GroqModel =
  | 'llama3-8b-8192'
  | 'llama3-70b-8192'
  | 'mixtral-8x7b-32768'
  | 'gemma2-9b-it'
  | 'llama-3.1-8b-instant'
  | 'llama-3.1-70b-versatile';

export const GroqModels: SupportedModel[] = [
  {
    model_id: 'llama3-8b-8192',
    input_cost_per_token: 0,
    output_cost_per_token: 0,
    provider: 'Groq',
  },
  {
    model_id: 'llama3-70b-8192',
    input_cost_per_token: 0,
    output_cost_per_token: 0,
    provider: 'Groq',
  },
  {
    model_id: 'mixtral-8x7b-32768',
    input_cost_per_token: 0,
    output_cost_per_token: 0,
    provider: 'Groq',
  },
  {
    model_id: 'gemma2-9b-it',
    input_cost_per_token: 0,
    output_cost_per_token: 0,
    provider: 'Groq',
  },
  {
    model_id: 'llama-3.1-8b-instant',
    input_cost_per_token: 0,
    output_cost_per_token: 0,
    provider: 'Groq',
  },
  {
    model_id: 'llama-3.1-70b-versatile',
    input_cost_per_token: 0,
    output_cost_per_token: 0,
    provider: 'Groq',
  },
];
