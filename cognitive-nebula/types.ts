import type { Vector3, Color } from 'three';

export interface Metrics {
  curiosity: number;
  confusion: number;
  coherence: number;
  arousal: number;
  valence: number;
  dominance: number;
  certainty: number;
  resonance: number;
}

export type AppState = 'idle' | 'thinking' | 'forming' | 'visualizing' | 'processing';

export interface NodeTarget {
  position: Vector3;
  color: Color;
}

export type ChatRole = 'user' | 'assistant';
export type ChatMsg = { role: ChatRole; content: string };

export interface AGISystemState {
  coherence: number;
  health: number;
  node_count: number;
  // Add other relevant AGI system state properties as needed
}

export interface ConversationContext {
  summary: string;
  topics: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  complexity: number;
  entities: string[];
  agiContext?: {
    consciousness_level: number;
    emotional_state: Record<string, number>;
    system_health: number;
    active_nodes: number;
  };
  // Add other relevant conversation context properties as needed
}
