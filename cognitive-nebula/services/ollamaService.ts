type ChatRole = 'system' | 'user' | 'assistant';
export type ChatMessage = { role: ChatRole; content: string };

function base() {
  return import.meta.env.VITE_OLLAMA_API_BASE ?? '/ollama';
}

function model() {
  return import.meta.env.VITE_OLLAMA_MODEL ?? 'llama3.1:8b-instruct-q4_K_M';
}

const DEFAULT_SYSTEM_PROMPT =
  'You are a vivid, thoughtful guide who answers with concise, imaginative insights about the user’s cosmic prompt. Respond in 1-2 sentences.';

export async function chat(messages: ChatMessage[], overrideModel?: string): Promise<string> {
  const res = await fetch(`${base()}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: overrideModel ?? model(), messages, stream: false }),
  });

  if (!res.ok) {
    throw new Error(`Ollama chat failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const content = json?.message?.content ?? '';

  if (!content) {
    throw new Error('No content from Ollama');
  }

  return content;
}

export interface FetchAIOptions {
  systemPrompt?: string;
  history?: ChatMessage[];
  model?: string;
}

const isConversationalRole = (role: ChatRole) => role === 'user' || role === 'assistant';

export async function fetchAIResponse(
  prompt: string,
  options: FetchAIOptions = {},
): Promise<string> {
  const trimmed = prompt?.trim();
  if (!trimmed) {
    throw new Error('Prompt is empty');
  }

  const messages: ChatMessage[] = [];

  messages.push({
    role: 'system',
    content: options.systemPrompt?.trim() || DEFAULT_SYSTEM_PROMPT,
  });

  if (options.history?.length) {
    for (const entry of options.history) {
      if (!entry.content?.trim()) continue;
      if (!isConversationalRole(entry.role)) continue;
      messages.push({ role: entry.role, content: entry.content.trim() });
    }
  }

  messages.push({ role: 'user', content: trimmed });

  const reply = await chat(messages, options.model);
  return reply.trim() || 'The cosmos hums softly, waiting for a spark.';
}

export async function toImagePrompt(userPrompt: string): Promise<string> {
  const sys: ChatMessage = {
    role: 'system',
    content:
      'You rewrite user requests into concise, vivid Stable Diffusion prompts with concrete nouns, camera/lighting, and style hints; avoid long prose. No disclaimers. Max ~60 tokens.',
  };
  const out = await chat([sys, { role: 'user', content: userPrompt }]);
  return out?.trim() || userPrompt;
}
