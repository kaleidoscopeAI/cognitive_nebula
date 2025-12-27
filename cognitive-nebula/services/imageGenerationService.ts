// src/services/imageGenerationService.ts
// Open-source Stable Diffusion (Automatic1111 / SD.Next) client.
// Returns a data URL (base64 PNG).

type SDResponse = {
  images?: string[];
  data?: string[];
};

const DEFAULT_WIDTH = 768;
const DEFAULT_HEIGHT = 768;

function getBaseUrl(): string {
  // Prefer env; otherwise assume a dev proxy from '/sdapi' -> 'http://127.0.0.1:7860'
  return import.meta.env.VITE_SD_API_BASE ?? '/sdapi';
}

export async function generateImageFromPrompt(prompt: string): Promise<string> {
  const url = `${getBaseUrl()}/v1/txt2img`;

  const body = {
    prompt,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    steps: 28,
    cfg_scale: 7,
    sampler_name: 'DPM++ 2M Karras',
    negative_prompt: 'blurry, low quality, deformed, artifacts, watermark, text, signature',
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Stable Diffusion request failed: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as SDResponse;

  const b64 =
    (json.images && json.images[0]) ||
    (json.data && json.data[0]);

  if (!b64) throw new Error('No image returned from Stable Diffusion');

  return `data:image/png;base64,${b64}`;
}
