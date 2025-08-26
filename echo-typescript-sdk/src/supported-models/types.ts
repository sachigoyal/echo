export interface SupportedModel {
  model_id: string;
  input_cost_per_token: number;
  output_cost_per_token: number;
  provider: string;
}


export interface SupportedImageModel {
  model_id: string;
  text_input_cost_per_token: number;
  image_input_cost_per_token: number;
  image_output_cost_per_token: number;
  provider: string;
}