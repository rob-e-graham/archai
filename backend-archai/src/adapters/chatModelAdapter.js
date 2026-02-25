import { env } from '../config/env.js';

export class ChatModelAdapter {
  async chat({ systemPrompt, userPrompt, objectRecord }) {
    // Mock response while local Ollama credentials/runtime are pending.
    const response = [
      `I can answer as ${objectRecord.title} using the verified record provided.`,
      objectRecord.curatorApproved?.[0] || 'I can only speak from the metadata I have been given.',
      `You asked: \"${userPrompt}\"`,
      objectRecord.unknownFields?.length ? `What I do not know: ${objectRecord.unknownFields[0]}.` : '',
      `Model mode: mock (${env.ollama.chatModel})`,
    ].filter(Boolean).join(' ');

    return { model: env.ollama.chatModel, mode: 'mock', response, systemPromptPreview: systemPrompt.content.slice(0, 180) };
  }
}

export const chatModelAdapter = new ChatModelAdapter();
