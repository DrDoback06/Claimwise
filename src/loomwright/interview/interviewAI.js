/**
 * interviewAI — chat with one or more characters in their voice.
 * Uses worldState data for character context.
 */

import aiService from '../../services/aiService';

export const PROMPT_DECK = [
  { id: 'fear',     label: 'What are you most afraid of?' },
  { id: 'secret',   label: 'What do you hide from the people you love?' },
  { id: 'origin',   label: 'Tell me about the first time you lied.' },
  { id: 'want',     label: 'What do you really want, right now?' },
  { id: 'grief',    label: 'Who do you grieve?' },
  { id: 'anger',    label: 'When was the last time you lost your temper?' },
  { id: 'home',     label: 'Where do you think of when you close your eyes?' },
  { id: 'shame',    label: 'What would shame you most if it came out?' },
  { id: 'hope',     label: 'What would make you happy five years from now?' },
  { id: 'change',   label: 'How have you changed since the beginning of this story?' },
];

function characterPrompt(actor, worldState) {
  const parts = [];
  parts.push(`You are ${actor.name || 'a character'}.`);
  if (actor.role) parts.push(`Role: ${actor.role}.`);
  if (actor.class) parts.push(`Archetype: ${actor.class}.`);
  if (actor.desc) parts.push(`Description: ${actor.desc}`);
  if (actor.biography) parts.push(`Biography: ${actor.biography}`);
  if (worldState?.meta?.premise) parts.push(`Story premise: ${worldState.meta.premise}`);
  if (worldState?.meta?.tone) parts.push(`Tone: ${worldState.meta.tone}`);
  parts.push(
    `Answer in-character. Use first person. Be specific and sensory. Stay true to voice and time period. Keep replies to 1\u20133 paragraphs unless asked for more.`
  );
  return parts.join('\n');
}

export async function askActor(actor, question, worldState, transcript = []) {
  const system = characterPrompt(actor, worldState);
  const history = transcript
    .map((m) => `${m.speaker}: ${m.text}`)
    .join('\n');
  const prompt = [
    history ? `Prior transcript:\n${history}\n` : '',
    `Interviewer: ${question}`,
    ``,
    `Respond as ${actor.name || 'the character'}:`,
  ].join('\n');
  try {
    const r = await aiService.callAI(prompt, 'creative', system);
    return String(r || '').trim();
  } catch {
    return '(Silence. The proxy is offline.)';
  }
}

export async function askGroup(actors, question, worldState, transcript = [], director) {
  const system = [
    `You are the voice of a table of characters discussing a question from the interviewer.`,
    `Write their replies in the format "NAME: reply". Have each speaker keep to 1\u20132 paragraphs.`,
    `Characters present:`,
    ...actors.map((a) => `- ${a.name}: ${a.desc || a.role || ''}`),
    director ? `Director note: ${director}` : '',
  ].join('\n');
  const history = transcript
    .map((m) => (m.speaker ? `${m.speaker}: ${m.text}` : m.text))
    .join('\n');
  const prompt = [
    history ? `Prior transcript:\n${history}\n` : '',
    `Interviewer: ${question}`,
  ].join('\n');
  try {
    const r = await aiService.callAI(prompt, 'creative', system);
    return String(r || '').trim();
  } catch {
    return '(Silence.)';
  }
}

export default { askActor, askGroup, PROMPT_DECK };
