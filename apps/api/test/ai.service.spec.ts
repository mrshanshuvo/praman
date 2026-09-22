import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { AiService } from '../src/modules/ai/ai.service.js';

describe('AiService - Dynamic Model Fallback Cascade', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  it('should parse AI_MODELS comma-separated list correctly', () => {
    process.env.AI_MODELS = 'model-a, model-b, model-c';
    delete process.env.AI_MODEL;
    const service = new AiService();

    expect(service.configuredModels).toEqual(['model-a', 'model-b', 'model-c']);
    expect(service.currentModel).toBe('model-a');
  });

  it('should fallback to AI_MODEL if AI_MODELS is not set', () => {
    delete process.env.AI_MODELS;
    process.env.AI_MODEL = 'custom-single-model';
    const service = new AiService();

    expect(service.configuredModels).toEqual(['custom-single-model']);
    expect(service.currentModel).toBe('custom-single-model');
  });

  it('should immediately switch to next model when TPD (daily limit) 429 is hit', async () => {
    process.env.OPENAI_API_KEY = 'mock-key';
    process.env.AI_MODELS = 'model-primary, model-fallback';
    const service = new AiService();

    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    // First call to model-primary returns 429 TPD
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            message:
              'Rate limit reached for model `model-primary` on tokens per day (TPD): Limit 100000. Please try again in 25m.',
          },
        }),
        { status: 429 },
      ),
    );

    // Second call to model-fallback succeeds with valid JSON
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({ result: 'success-from-fallback' }),
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const schema = z.object({ result: z.string() });
    const output = await service.runStructuredCall({
      systemPrompt: 'System',
      userPrompt: 'User',
      outputSchema: schema,
      schemaName: 'TestSchema',
    });

    expect(output).toEqual({ result: 'success-from-fallback' });
    expect(service.currentModel).toBe('model-fallback');
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    // Verify first request was sent with model-primary and second with model-fallback
    const firstCallPayload = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    const secondCallPayload = JSON.parse(fetchSpy.mock.calls[1][1]?.body as string);
    expect(firstCallPayload.model).toBe('model-primary');
    expect(secondCallPayload.model).toBe('model-fallback');
  });

  it('should wait and retry on TPM (per-minute) 429 before cascading', async () => {
    process.env.OPENAI_API_KEY = 'mock-key';
    process.env.AI_MODELS = 'model-primary, model-fallback';
    const service = new AiService();

    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    // First call to model-primary returns TPM 429 (try again in 0.05s)
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            message:
              'Rate limit reached for model `model-primary` on tokens per minute (TPM): Limit 8000. Please try again in 0.01s.',
          },
        }),
        { status: 429 },
      ),
    );

    // Second call to model-primary succeeds
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({ result: 'recovered-on-same-model' }),
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const schema = z.object({ result: z.string() });
    const output = await service.runStructuredCall({
      systemPrompt: 'System',
      userPrompt: 'User',
      outputSchema: schema,
      schemaName: 'TestSchema',
    });

    expect(output).toEqual({ result: 'recovered-on-same-model' });
    // Model should stay on model-primary
    expect(service.currentModel).toBe('model-primary');
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    const firstCallPayload = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    const secondCallPayload = JSON.parse(fetchSpy.mock.calls[1][1]?.body as string);
    expect(firstCallPayload.model).toBe('model-primary');
    expect(secondCallPayload.model).toBe('model-primary');
  });

  it('should immediately cascade to next model when a model returns 404 (not found / token maxed)', async () => {
    process.env.OPENAI_API_KEY = 'mock-key';
    process.env.AI_MODELS = 'model-not-found, model-fallback';
    const service = new AiService();

    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    // First call returns 404 (model does not exist or maxed out)
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            message: 'The model `model-not-found` does not exist or you do not have access to it.',
            code: 'model_not_found',
          },
        }),
        { status: 404 },
      ),
    );

    // Second call to model-fallback succeeds
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({ result: 'success-after-404' }),
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const schema = z.object({ result: z.string() });
    const output = await service.runStructuredCall({
      systemPrompt: 'System',
      userPrompt: 'User',
      outputSchema: schema,
      schemaName: 'TestSchema',
    });

    expect(output).toEqual({ result: 'success-after-404' });
    expect(service.currentModel).toBe('model-fallback');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
