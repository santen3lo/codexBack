export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  input_cost_per_1m: number;
  output_cost_per_1m: number;
  supports_thinking?: boolean;
  description?: string;
  is_default?: boolean;
}

export interface ModelMetrics {
  model_id: string;
  ttft_seconds: number;
  total_seconds: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  is_fastest: boolean;
  is_cheapest: boolean;
}

export interface ModelState {
  model_id: string;
  status: 'idle' | 'streaming' | 'completed' | 'error';
  text: string;
  thinking: string;
  metrics?: ModelMetrics;
  error?: string;
}

export interface ChatTurn {
  id: string;
  prompt: string;
  modelStates: Record<string, ModelState>;
  fastestModelId?: string;
  cheapestModelId?: string;
}

export type StreamEvent =
  | { type: 'chunk'; model_id: string; delta: string }
  | { type: 'thinking'; model_id: string; delta: string }
  | { type: 'metrics'; model_id: string; metrics: ModelMetrics }
  | { type: 'error'; model_id: string; message: string }
  | { type: 'summary_badges'; fastest_model_id?: string; cheapest_model_id?: string }
  | { type: 'done' };

