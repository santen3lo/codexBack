import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ComparisonGrid } from './components/ComparisonGrid';
import { InputBar } from './components/InputBar';
import { ScrollToTop } from './components/ScrollToTop';
import { useChatStream } from './hooks/useChatStream';
import { ModelInfo, ModelState, ChatTurn } from './types';

// Default initial fallback models matching Figma layout
const FALLBACK_MODELS: ModelInfo[] = [
  {
    id: 'claude-haiku-3-5',
    name: 'Claude Haiku 3.5',
    provider: 'Anthropic',
    input_cost_per_1m: 0.8,
    output_cost_per_1m: 4.0,
    supports_thinking: true,
  },
  {
    id: 'yandexgpt-5-lite',
    name: 'YandexGPT 5 Lite',
    provider: 'Яндекс',
    input_cost_per_1m: 0.2,
    output_cost_per_1m: 0.4,
  },
  {
    id: 'gigachat-2',
    name: 'GigaChat 2',
    provider: 'Сбер',
    input_cost_per_1m: 0.25,
    output_cost_per_1m: 0.5,
  },
];

export const App: React.FC = () => {
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>(FALLBACK_MODELS);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>(['claude-haiku-3-5', 'yandexgpt-5-lite', 'gigachat-2']);
  const [chatTurns, setChatTurns] = useState<ChatTurn[]>([]);

  const { isLoading, retryingModelId, startStream, retrySingleModel } = useChatStream();

  // Load models from backend API & sync with URL params
  useEffect(() => {
    async function loadModels() {
      try {
        const res = await fetch('/api/models');
        if (res.ok) {
          const data: ModelInfo[] = await res.json();
          setAvailableModels(data);

          // Read URL query params
          const params = new URLSearchParams(window.location.search);
          const urlModels = params.get('models');
          if (urlModels) {
            const ids = urlModels.split(',').filter((id) => data.some((m) => m.id === id));
            if (ids.length >= 2 && ids.length <= 4) {
              setSelectedModelIds(ids);
              return;
            }
          }

          // Otherwise use defaults
          const defaults = data.filter((m) => m.is_default).map((m) => m.id);
          if (defaults.length >= 2) {
            setSelectedModelIds(defaults.slice(0, 3));
          }
        }
      } catch {
        // Fallback already in place
      }
    }
    loadModels();
  }, []);

  // Sync selected models to URL query param
  const updateUrlModels = (modelIds: string[]) => {
    const url = new URL(window.location.href);
    url.searchParams.set('models', modelIds.join(','));
    window.history.replaceState({}, '', url.toString());
  };

  const handleAddModel = (modelId: string) => {
    if (selectedModelIds.length >= 4 || selectedModelIds.includes(modelId)) return;
    const next = [...selectedModelIds, modelId];
    setSelectedModelIds(next);
    updateUrlModels(next);
  };

  const handleRemoveModel = (modelId: string) => {
    if (selectedModelIds.length <= 2) return;
    const next = selectedModelIds.filter((id) => id !== modelId);
    setSelectedModelIds(next);
    updateUrlModels(next);
  };

  const handleNewComparison = () => {
    setChatTurns([]);
    const url = new URL(window.location.href);
    url.search = '';
    window.history.replaceState({}, '', url.toString());
  };

  const handlePromptSubmit = (prompt: string) => {
    const turnId = `turn-${Date.now()}`;
    const initialStates: Record<string, ModelState> = {};

    for (const mid of selectedModelIds) {
      initialStates[mid] = {
        model_id: mid,
        status: 'streaming',
        text: '',
        thinking: '',
      };
    }

    const newTurn: ChatTurn = {
      id: turnId,
      prompt,
      modelStates: initialStates,
    };

    setChatTurns((prev) => [...prev, newTurn]);

    startStream(prompt, selectedModelIds, (event) => {
      setChatTurns((prev) =>
        prev.map((turn) => {
          if (turn.id !== turnId) return turn;

          const updatedStates = { ...turn.modelStates };

          if (event.type === 'chunk') {
            const current = updatedStates[event.model_id];
            if (current) {
              updatedStates[event.model_id] = {
                ...current,
                status: 'streaming',
                text: current.text + event.delta,
              };
            }
          } else if (event.type === 'thinking') {
            const current = updatedStates[event.model_id];
            if (current) {
              updatedStates[event.model_id] = {
                ...current,
                thinking: current.thinking + event.delta,
              };
            }
          } else if (event.type === 'metrics') {
            const current = updatedStates[event.model_id];
            if (current) {
              updatedStates[event.model_id] = {
                ...current,
                metrics: event.metrics,
              };
            }
          } else if (event.type === 'error') {
            const current = updatedStates[event.model_id];
            if (current) {
              updatedStates[event.model_id] = {
                ...current,
                status: 'error',
                error: event.message,
              };
            }
          } else if (event.type === 'summary_badges') {
            return {
              ...turn,
              fastestModelId: event.fastest_model_id,
              cheapestModelId: event.cheapest_model_id,
            };
          } else if (event.type === 'done') {
            for (const mid in updatedStates) {
              if (updatedStates[mid].status === 'streaming') {
                updatedStates[mid].status = 'completed';
              }
            }
          }

          return {
            ...turn,
            modelStates: updatedStates,
          };
        })
      );
    });
  };

  const handleRetryModel = (turnId: string, modelId: string) => {
    const turn = chatTurns.find((t) => t.id === turnId);
    if (!turn) return;

    setChatTurns((prev) =>
      prev.map((t) => {
        if (t.id !== turnId) return t;
        return {
          ...t,
          modelStates: {
            ...t.modelStates,
            [modelId]: {
              model_id: modelId,
              status: 'streaming',
              text: '',
              thinking: '',
              error: undefined,
              metrics: undefined,
            },
          },
        };
      })
    );

    retrySingleModel(turn.prompt, modelId, (event) => {
      setChatTurns((prev) =>
        prev.map((t) => {
          if (t.id !== turnId) return t;
          const updated = { ...t.modelStates };
          const current = updated[modelId];
          if (!current) return t;

          if (event.type === 'chunk') {
            updated[modelId] = {
              ...current,
              status: 'streaming',
              text: current.text + event.delta,
            };
          } else if (event.type === 'thinking') {
            updated[modelId] = {
              ...current,
              thinking: current.thinking + event.delta,
            };
          } else if (event.type === 'metrics') {
            updated[modelId] = {
              ...current,
              metrics: event.metrics,
            };
          } else if (event.type === 'error') {
            updated[modelId] = {
              ...current,
              status: 'error',
              error: event.message,
            };
          } else if (event.type === 'done') {
            if (updated[modelId].status === 'streaming') {
              updated[modelId].status = 'completed';
            }
          }

          return { ...t, modelStates: updated };
        })
      );
    });
  };

  const selectedModels = selectedModelIds
    .map((id) => availableModels.find((m) => m.id === id))
    .filter(Boolean) as ModelInfo[];

  return (
    <div className="min-h-screen flex flex-col bg-dark-950 text-dark-100 pb-28">
      {/* Top Header */}
      <Header onNewComparison={handleNewComparison} />

      {/* Main Comparison Area */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-10">
        {chatTurns.length === 0 ? (
          /* Initial Empty Grid View */
          <ComparisonGrid
            prompt=""
            selectedModels={selectedModels}
            availableModels={availableModels}
            modelStates={{}}
            onRemoveModel={handleRemoveModel}
            onAddModel={handleAddModel}
            onRetryModel={() => {}}
          />
        ) : (
          /* Multi-turn Chat History */
          chatTurns.map((turn) => (
            <ComparisonGrid
              key={turn.id}
              prompt={turn.prompt}
              selectedModels={selectedModels}
              availableModels={availableModels}
              modelStates={turn.modelStates}
              onRemoveModel={handleRemoveModel}
              onAddModel={handleAddModel}
              onRetryModel={(mid) => handleRetryModel(turn.id, mid)}
              retryingModelId={retryingModelId}
              fastestModelId={turn.fastestModelId}
              cheapestModelId={turn.cheapestModelId}
            />
          ))
        )}
      </main>

      {/* Floating Scroll-to-Top Button */}
      <ScrollToTop />

      {/* Bottom Floating Input Bar */}
      <InputBar onSubmit={handlePromptSubmit} isLoading={isLoading} />
    </div>
  );
};

