import React, { useState, useRef, useEffect } from 'react';
import { Plus, Check } from 'lucide-react';
import { ModelInfo } from '../types';

interface AddModelDropdownProps {
  availableModels: ModelInfo[];
  selectedModelIds: string[];
  onAddModel: (modelId: string) => void;
  maxModelsReached?: boolean;
}

export const AddModelDropdown: React.FC<AddModelDropdownProps> = ({
  availableModels,
  selectedModelIds,
  onAddModel,
  maxModelsReached = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unselectedModels = availableModels.filter(
    (m) => !selectedModelIds.includes(m.id)
  );

  if (maxModelsReached) {
    return null;
  }

  return (
    <div className="relative min-w-[240px] max-w-[280px] flex-1" ref={dropdownRef}>
      {/* Plus column card matching Figma */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-full min-h-[160px] border border-dashed border-dark-750 hover:border-dark-600 bg-dark-900/30 hover:bg-dark-900/60 rounded-2xl flex flex-col items-center justify-center gap-3 p-6 text-dark-400 hover:text-dark-200 transition-all duration-150 select-none group"
      >
        <div className="w-10 h-10 rounded-full bg-dark-850 group-hover:bg-dark-800 border border-dark-750 flex items-center justify-center transition-colors">
          <Plus className="w-5 h-5 text-dark-300 group-hover:text-white" />
        </div>
        <span className="text-xs font-medium">Добавить модель</span>
      </button>

      {/* Dropdown list */}
      {isOpen && (
        <div className="absolute top-14 left-0 right-0 z-50 p-1.5 rounded-xl bg-dark-900 border border-dark-700 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2.5 py-1.5 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">
            Выберите модель ({selectedModelIds.length}/4)
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-dark-850/50">
            {unselectedModels.length === 0 ? (
              <div className="p-3 text-center text-xs text-dark-400">
                Все доступные модели уже добавлены
              </div>
            ) : (
              unselectedModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onAddModel(model.id);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-dark-800 transition-colors flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-medium text-white group-hover:text-white">
                      {model.name}
                    </div>
                    <div className="text-[11px] text-dark-400">
                      {model.provider}
                    </div>
                  </div>
                  <div className="text-[10px] text-dark-500 font-mono">
                    ${model.input_cost_per_1m}/${model.output_cost_per_1m}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
