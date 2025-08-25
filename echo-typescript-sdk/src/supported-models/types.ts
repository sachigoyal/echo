export interface SupportedModel {
    model_id: string;
    input_cost_per_token: number;
    output_cost_per_token: number;
    provider: string;
}