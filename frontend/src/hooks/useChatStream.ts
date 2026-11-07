import { useState, useCallback, useRef } from 'react';
import { ModelState, ModelMetrics, StreamEvent } from '../types';

export function useChatStream() {
  const [isLoading, setIsLoading] = useState(false);
  const [retryingModelId, setRetryingModelId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(
    async (
      prompt: string,
      modelIds: string[],
      onEvent: (event: StreamEvent) => void
    ) => {
      setIsLoading(true);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            model_ids: modelIds,
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = errData.detail || `Ошибка сервера (${response.status})`;
          for (const mid of modelIds) {
            onEvent({ type: 'error', model_id: mid, message: errMsg });
          }
          setIsLoading(false);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data:')) {
              try {
                const payload = trimmed.slice(5).trim();
                const event = JSON.parse(payload) as StreamEvent;
                onEvent(event);
              } catch {
                // Ignore parse errors on partial chunks
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          for (const mid of modelIds) {
            onEvent({
              type: 'error',
              model_id: mid,
              message: err.message || 'Ошибка подключения к серверу',
            });
          }
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const retrySingleModel = useCallback(
    async (
      prompt: string,
      modelId: string,
      onEvent: (event: StreamEvent) => void
    ) => {
      setRetryingModelId(modelId);

      try {
        const response = await fetch('/api/chat/retry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            model_id: modelId,
          }),
        });

        if (!response.ok || !response.body) {
          const errData = await response.json().catch(() => ({}));
          onEvent({
            type: 'error',
            model_id: modelId,
            message: errData.detail || `Ошибка сервера (${response.status})`,
          });
          setRetryingModelId(null);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data:')) {
              try {
                const payload = trimmed.slice(5).trim();
                const event = JSON.parse(payload) as StreamEvent;
                onEvent(event);
              } catch {}
            }
          }
        }
      } catch (err: any) {
        onEvent({
          type: 'error',
          model_id: modelId,
          message: err.message || 'Ошибка подключения к серверу',
        });
      } finally {
        setRetryingModelId(null);
      }
    },
    []
  );

  return {
    isLoading,
    retryingModelId,
    startStream,
    retrySingleModel,
  };
}
