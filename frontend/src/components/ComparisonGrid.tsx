import React from 'react';
import { ModelInfo, ModelState } from '../types';
import { ModelColumn } from './ModelColumn';
import { AddModelDropdown } from './AddModelDropdown';
import { MobileTabs } from './MobileTabs';

interface ComparisonGridProps {
  prompt: string;
  selectedModels: ModelInfo[];
  availableModels: ModelInfo[];
  modelStates: Record<string, ModelState>;
  onRemoveModel: (modelId: string) => void;
  onAddModel: (modelId: string) => void;
  onRetryModel: (modelId: string) => void;
  retryingModelId?: string | null;
  fastestModelId?: string;
  cheapestModelId?: string;
}

export const ComparisonGrid: React.FC<ComparisonGridProps> = ({
  prompt,
  selectedModels,
  availableModels,
  modelStates,
  onRemoveModel,
  onAddModel,
  onRetryModel,
  retryingModelId,
  fastestModelId,
  cheapestModelId,
}) => {
  return (
    <div className="w-full flex flex-col gap-6">
      {/* User query bubble aligned to the right (as seen in Figma) */}
      {prompt && (
        <div className="w-full flex justify-end">
          <div className="max-w-2xl px-5 py-3 rounded-3xl bg-dark-850 border border-dark-750 text-white text-sm leading-relaxed shadow-sm">
            {prompt}
          </div>
        </div>
      )}

      {/* Desktop view: side-by-side columns (2-4 models) */}
      <div className="hidden md:flex items-start gap-4 w-full">
        {selectedModels.map((model) => (
          <ModelColumn
            key={model.id}
            model={model}
            state={modelStates[model.id]}
            canRemove={selectedModels.length > 2}
            onRemove={() => onRemoveModel(model.id)}
            onRetry={() => onRetryModel(model.id)}
            isRetrying={retryingModelId === model.id}
            isFastest={fastestModelId === model.id}
            isCheapest={cheapestModelId === model.id}
          />
        ))}

        {/* Plus column for adding next model if < 4 */}
        {selectedModels.length < 4 && (
          <AddModelDropdown
            availableModels={availableModels}
            selectedModelIds={selectedModels.map((m) => m.id)}
            onAddModel={onAddModel}
            maxModelsReached={selectedModels.length >= 4}
          />
        )}
      </div>

      {/* Mobile view (< 768px): tabs mode */}
      <div className="block md:hidden w-full">
        <MobileTabs
          selectedModels={selectedModels}
          availableModels={availableModels}
          modelStates={modelStates}
          onRemoveModel={onRemoveModel}
          onAddModel={onAddModel}
          onRetryModel={onRetryModel}
          retryingModelId={retryingModelId}
          fastestModelId={fastestModelId}
          cheapestModelId={cheapestModelId}
        />
      </div>
    </div>
  );
};
