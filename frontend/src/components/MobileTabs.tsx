import React, { useState } from 'react';
import { ModelInfo, ModelState } from '../types';
import { ModelColumn } from './ModelColumn';
import { AddModelDropdown } from './AddModelDropdown';

interface MobileTabsProps {
  selectedModels: ModelInfo[];
  availableModels: ModelInfo[];
  modelStates?: Record<string, ModelState>;
  onRemoveModel: (modelId: string) => void;
  onAddModel: (modelId: string) => void;
  onRetryModel: (modelId: string) => void;
  retryingModelId?: string | null;
  fastestModelId?: string;
  cheapestModelId?: string;
}

export const MobileTabs: React.FC<MobileTabsProps> = ({
  selectedModels,
  availableModels,
  modelStates = {},
  onRemoveModel,
  onAddModel,
  onRetryModel,
  retryingModelId,
  fastestModelId,
  cheapestModelId,
}) => {
  const [activeModelId, setActiveModelId] = useState<string>(
    selectedModels[0]?.id || ''
  );

  // If the active model was removed, fallback to the first available model
  const currentModel =
    selectedModels.find((m) => m.id === activeModelId) || selectedModels[0];

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Horizontal scrolling tab list */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-dark-800">
        {selectedModels.map((model) => {
          const isActive = model.id === currentModel?.id;
          const state = modelStates[model.id];
          const hasError = state?.status === 'error';
          const isStreaming = state?.status === 'streaming';

          return (
            <button
              key={model.id}
              onClick={() => setActiveModelId(model.id)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 flex items-center gap-2 border ${
                isActive
                  ? 'bg-dark-850 text-white border-dark-700 shadow-sm'
                  : 'bg-dark-900/40 text-dark-400 border-transparent hover:text-dark-200'
              }`}
            >
              <span>{model.name}</span>
              {isStreaming && (
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              )}
              {hasError && (
                <span className="w-2 h-2 rounded-full bg-red-400" />
              )}
            </button>
          );
        })}

        {/* Plus tab if less than 4 */}
        {selectedModels.length < 4 && (
          <div className="flex-shrink-0">
            <AddModelDropdown
              availableModels={availableModels}
              selectedModelIds={selectedModels.map((m) => m.id)}
              onAddModel={onAddModel}
              maxModelsReached={selectedModels.length >= 4}
            />
          </div>
        )}
      </div>

      {/* Active model view */}
      {currentModel && (
        <div className="w-full">
          <ModelColumn
            key={currentModel.id}
            model={currentModel}
            state={modelStates[currentModel.id]}
            canRemove={selectedModels.length > 2}
            onRemove={() => onRemoveModel(currentModel.id)}
            onRetry={() => onRetryModel(currentModel.id)}
            isRetrying={retryingModelId === currentModel.id}
            isFastest={fastestModelId === currentModel.id}
            isCheapest={cheapestModelId === currentModel.id}
          />
        </div>
      )}
    </div>
  );
};

