import { SupportedTool, ToolPricing } from '../types';

export type XAITool = 'x_search';

export const XAITools: SupportedTool[] = [
  {
    type: 'web_search_preview',
    description: 'Search the X platform and web for real-time info',
    pricing_structure: 'per_call',
  },
];

export const DefaultXAIToolPricing: ToolPricing = {
  image_generation: {
    gpt_image_1: {
      low: { '1024x1024': 0, '1024x1536': 0, '1536x1024': 0 },
      medium: { '1024x1024': 0, '1024x1536': 0, '1536x1024': 0 },
      high: { '1024x1024': 0, '1024x1536': 0, '1536x1024': 0 },
    },
  },
  code_interpreter: { cost_per_session: 0 },
  file_search: {
    cost_per_call: 0,
    storage_cost_per_gb_per_day: 0,
    free_storage_gb: 0,
  },
  web_search_preview: {
    gpt_4o: { cost_per_call: 0.025 },
    gpt_5: { cost_per_call: 0.01 },
    o_series: { cost_per_call: 0.01 },
  },
};
