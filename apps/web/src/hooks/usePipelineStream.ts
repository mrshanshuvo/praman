'use client';

import type {
  CandidateJdAnalysisRecord,
  JobDescriptionRecord,
  ResumeRecord,
} from '@praman/schemas';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import type { PipelineStage } from '@/components/PipelineStepper';
import { queryKeys } from '@/lib/query-keys';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const TOKEN_KEY = 'praman_auth_token';

export type StageRunStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface PipelineStreamLog {
  id: string;
  stage: string;
  status: string;
  message: string;
  timestamp: string;
}

export interface PipelineStreamEvent {
  stage: 'match' | 'strategy' | 'resume' | 'pipeline';
  status: 'started' | 'completed' | 'failed' | 'complete';
  message: string;
  data?:
    | CandidateJdAnalysisRecord
    | NonNullable<CandidateJdAnalysisRecord['strategy']>
    | ResumeRecord
    | unknown;
  timestamp: string;
}

interface UsePipelineStreamOptions {
  onStageChange?: (stage: PipelineStage) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export function usePipelineStream(jobId: string, options?: UsePipelineStreamOptions) {
  const queryClient = useQueryClient();
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeStage, setActiveStage] = useState<PipelineStage | null>(null);
  const [stageStatuses, setStageStatuses] = useState<Record<PipelineStage, StageRunStatus>>({
    structured: 'completed',
    match: 'idle',
    strategy: 'idle',
    resume: 'idle',
  });
  const [liveLogs, setLiveLogs] = useState<PipelineStreamLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setActiveStage(null);
  }, []);

  const startStream = useCallback(async () => {
    if (!jobId || isStreaming) return;

    setError(null);
    setIsStreaming(true);
    setLiveLogs([]);

    // Initialize stage states for pipeline execution
    setStageStatuses({
      structured: 'completed',
      match: 'idle',
      strategy: 'idle',
      resume: 'idle',
    });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    const url = new URL(`${API_URL}/pipelines/${jobId}/stream`);
    if (token) {
      url.searchParams.set('token', token);
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Connection failed');
        throw new Error(`SSE stream failed with status ${response.status}: ${errorText}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r\n|\r|\n/);
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed?.startsWith('data:')) continue;

          const jsonString = trimmed.slice(5).trim();
          if (!jsonString) continue;

          try {
            const event: PipelineStreamEvent = JSON.parse(jsonString);

            // Append log entry and resolve prior started logs
            setLiveLogs((prev) => {
              const updated = prev.map((item) => {
                if (item.status === 'started') {
                  if (event.status === 'completed' || event.status === 'complete') {
                    if (event.stage === 'pipeline' || item.stage === event.stage) {
                      return { ...item, status: 'completed' };
                    }
                  } else if (event.status === 'failed') {
                    if (event.stage === 'pipeline' || item.stage === event.stage) {
                      return { ...item, status: 'failed' };
                    }
                  } else if (event.status === 'started' && item.stage !== event.stage) {
                    return { ...item, status: 'completed' };
                  }
                }
                return item;
              });

              return [
                ...updated,
                {
                  id: `${Date.now()}-${Math.random()}`,
                  stage: event.stage,
                  status: event.status,
                  message: event.message,
                  timestamp: event.timestamp || new Date().toLocaleTimeString(),
                },
              ];
            });

            // Handle Stage Transitions
            if (event.stage === 'match') {
              if (event.status === 'started') {
                setActiveStage('match');
                options?.onStageChange?.('match');
                setStageStatuses((prev) => ({ ...prev, match: 'running' }));
              } else if (event.status === 'completed') {
                setStageStatuses((prev) => ({ ...prev, match: 'completed' }));
                if (event.data) {
                  queryClient.setQueryData<JobDescriptionRecord>(
                    queryKeys.jobs.detail(jobId),
                    (old) => {
                      if (!old) return old;
                      return { ...old, analysis: event.data as CandidateJdAnalysisRecord };
                    },
                  );
                }
              }
            } else if (event.stage === 'strategy') {
              if (event.status === 'started') {
                setActiveStage('strategy');
                options?.onStageChange?.('strategy');
                setStageStatuses((prev) => ({ ...prev, match: 'completed', strategy: 'running' }));
              } else if (event.status === 'completed') {
                setStageStatuses((prev) => ({ ...prev, strategy: 'completed' }));
                if (event.data) {
                  queryClient.setQueryData<JobDescriptionRecord>(
                    queryKeys.jobs.detail(jobId),
                    (old) => {
                      if (!old) return old;
                      const existingAnalysis = old.analysis ?? ({} as CandidateJdAnalysisRecord);
                      return {
                        ...old,
                        analysis: {
                          ...existingAnalysis,
                          strategy: event.data as NonNullable<
                            CandidateJdAnalysisRecord['strategy']
                          >,
                        },
                      };
                    },
                  );
                }
              }
            } else if (event.stage === 'resume') {
              if (event.status === 'started') {
                setActiveStage('resume');
                options?.onStageChange?.('resume');
                setStageStatuses((prev) => ({
                  ...prev,
                  match: 'completed',
                  strategy: 'completed',
                  resume: 'running',
                }));
              } else if (event.status === 'completed') {
                setStageStatuses((prev) => ({ ...prev, resume: 'completed' }));
                if (event.data) {
                  queryClient.setQueryData<JobDescriptionRecord>(
                    queryKeys.jobs.detail(jobId),
                    (old) => {
                      if (!old) return old;
                      const existingAnalysis = old.analysis;
                      if (!existingAnalysis?.strategy) return old;
                      return {
                        ...old,
                        analysis: {
                          ...existingAnalysis,
                          strategy: {
                            ...existingAnalysis.strategy,
                            resume: event.data as ResumeRecord,
                          },
                        },
                      };
                    },
                  );
                }
              }
            } else if (event.stage === 'pipeline') {
              if (event.status === 'complete') {
                setActiveStage(null);
                setIsStreaming(false);
                setStageStatuses({
                  structured: 'completed',
                  match: 'completed',
                  strategy: 'completed',
                  resume: 'completed',
                });
                queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
                options?.onComplete?.();
              } else if (event.status === 'failed') {
                const failMsg = event.message || 'Pipeline execution failed';
                setError(failMsg);
                setIsStreaming(false);
                setActiveStage(null);
                setStageStatuses((prev) => {
                  const updated = { ...prev };
                  if (activeStage) {
                    updated[activeStage] = 'failed';
                  }
                  return updated;
                });
                options?.onError?.(failMsg);
              }
            }
          } catch (parseError) {
            console.warn('Failed to parse SSE payload:', jsonString, parseError);
          }
        }
      }

      setIsStreaming(false);
      setActiveStage(null);
    } catch (streamError: unknown) {
      const err = streamError as { name?: string; message?: string } | null;
      if (err?.name === 'AbortError') {
        console.log('SSE Pipeline stream cancelled by client.');
      } else {
        const errorMsg = err?.message || 'Error occurred while streaming pipeline.';
        setError(errorMsg);
        options?.onError?.(errorMsg);
      }
      setIsStreaming(false);
      setActiveStage(null);
    }
  }, [jobId, isStreaming, activeStage, options, queryClient]);

  return {
    isStreaming,
    activeStage,
    stageStatuses,
    liveLogs,
    error,
    startStream,
    cancelStream,
  };
}
