import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { ModelInfo, ModelState } from '../types';
import { ThinkingBlock } from './ThinkingBlock';
import { MarkdownContent } from './MarkdownContent';
import { MetricsFooter } from './MetricsFooter';
import { ErrorCard } from './ErrorCard';

interface ModelColumnProps {
  model: ModelInfo;
  state?: ModelState;
  canRemove: boolean;
  onRemove: () => void;
  onRetry: () => void;
  isRetrying?: boolean;
  isFastest?: boolean;
  isCheapest?: boolean;
}

export const ModelColumn: React.FC<ModelColumnProps> = ({
  model,
  state,
  canRemove,
  onRemove,
  onRetry,
  isRetrying = false,
  isFastest = false,
  isCheapest = false,
}) => {
  const isStreaming = state?.status === 'streaming';
  const isError = state?.status === 'error';
  const hasText = Boolean(state?.text);

  return (
    <div className="flex-1 min-w-[280px] max-w-full flex flex-col bg-dark-950/40 rounded-2xl border border-dark-800/80 overflow-hidden shadow-sm">
      {/* Sticky Column Header */}
      <div className="sticky top-[53px] z-30 px-4 py-3.5 bg-dark-900/90 backdrop-blur-md border-b border-dark-800 flex items-center justify-between select-none">
        <div>
          <div className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
            <span>{model.name}</span>
            {isStreaming && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-dark-400" />
            )}
          </div>
          <div className="text-xs text-dark-400 font-normal">
            {model.provider}
          </div>
        </div>

        {canRemove && (
          <button
            onClick={onRemove}
            className="w-7 h-7 rounded-full bg-dark-800 hover:bg-dark-750 flex items-center justify-center text-dark-400 hover:text-white transition-colors"
            title="Убрать модель из сравнения"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Column Content Area */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Thinking Block */}
          {state?.thinking && (
            <ThinkingBlock
              thinking={state.thinking}
              durationSeconds={state.metrics?.ttft_seconds || 4}
            />
          )}

          {/* Error Message */}
          {isError && (
            <ErrorCard
              message={state.error || 'Модель не ответила за 60 секунд'}
              onRetry={onRetry}
              isRetrying={isRetrying}
            />
          )}

          {/* Main Markdown Content */}
          {hasText && (
            <div className="relative">
              <MarkdownContent content={state?.text || ''} />
              {isStreaming && (
                <span className="inline-block w-1.5 h-4 ml-1 bg-white animate-pulse align-middle" />
              )}
            </div>
          )}

          {/* Empty state while waiting for the first chunk */}
          {!hasText && !isError && isStreaming && (
            <div className="flex items-center gap-2 py-8 text-xs text-dark-400">
              <Loader2 className="w-4 h-4 animate-spin text-dark-400" />
              <span>Ожидание ответа модели...</span>
            </div>
          )}

          {!hasText && !isError && !isStreaming && (
            <div className="py-12 text-center text-xs text-dark-500">
              Задайте вопрос внизу, чтобы получить ответ от {model.name}
            </div>
          )}
        </div>

        {/* Metrics Footer */}
        {state?.metrics && !isError && (
          <MetricsFooter
            metrics={state.metrics}
            isFastest={isFastest}
            isCheapest={isCheapest}
          />
        )}
      </div>
    </div>
  );
};
