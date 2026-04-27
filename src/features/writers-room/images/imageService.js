// Loomwright — image generation service. Two providers:
//   • OpenAI DALL-E 3 (paid; uses the OpenAI API key already in
//     profile.apiKeys.openai).
//   • Hugging Face Inference (free; uses profile.apiKeys.huggingface
//     if set, otherwise public anonymous endpoint).
//
// Returns a dataURL string. Caller is responsible for storing that on
// the entity (e.g. character.avatar = url).

import aiService from '../../../services/aiService';

function getKey(store, provider) {
  return store.profile?.apiKeys?.[provider]
    || aiService.getRuntimeKeys?.()?.[provider]
    || '';
}

// Build the final prompt by stitching: user prompt + entity descriptors +
// the saga-wide image style preference (profile.imageStyle).
export function composePrompt(store, entity, userPrompt) {
  const style = (store.profile?.imageStyle || '').trim();
  const parts = [];
  if (userPrompt) parts.push(userPrompt);
  if (entity?.name) parts.push(entity.name);
  if (entity?.description) parts.push(entity.description);
  if (entity?.role) parts.push(entity.role);
  if (entity?.kind) parts.push(`type: ${entity.kind}`);
  if (style) parts.push(`Style: ${style}`);
  return parts.filter(Boolean).join(' · ');
}

// Try DALL-E first if a key is present, otherwise Hugging Face.
export async function generateImage(store, entity, userPrompt, opts = {}) {
  const prompt = composePrompt(store, entity, userPrompt);
  const preferred = opts.provider || (getKey(store, 'openai') ? 'openai' : 'huggingface');

  if (preferred === 'openai') {
    try { return await dalle(getKey(store, 'openai'), prompt, opts); }
    catch (err) {
      console.warn('[image] DALL-E failed, falling back to Hugging Face:', err?.message);
      return await huggingface(getKey(store, 'huggingface'), prompt, opts);
    }
  }
  return await huggingface(getKey(store, 'huggingface'), prompt, opts);
}

async function dalle(key, prompt, opts) {
  if (!key) throw new Error('No OpenAI API key configured.');
  const size = opts.size || '1024x1024';
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: opts.model || 'dall-e-3',
      prompt: prompt.slice(0, 4000),
      n: 1,
      size,
      response_format: 'b64_json',
      quality: opts.quality || 'standard',
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`DALL-E ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error('DALL-E returned no image.');
  return 'data:image/png;base64,' + b64;
}

const HF_MODEL = 'stabilityai/stable-diffusion-xl-base-1.0';

async function huggingface(key, prompt, opts) {
  const headers = { 'Content-Type': 'application/json' };
  if (key) headers['Authorization'] = `Bearer ${key}`;
  const res = await fetch(`https://api-inference.huggingface.co/models/${opts.hfModel || HF_MODEL}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      inputs: prompt.slice(0, 1500),
      parameters: { num_inference_steps: 25 },
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HF ${res.status}: ${text.slice(0, 200)}`);
  }
  const blob = await res.blob();
  return await blobToDataUrl(blob);
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
